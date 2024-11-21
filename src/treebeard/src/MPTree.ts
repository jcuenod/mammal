import MPTreeNode from "./MPTreeNode";
import type { NodeRow, MPTreeNodeWithChildren } from "./MPTreeNode";
import { getNextChildPath } from "./treeUtils";

export type StaticTreeNode = {
  path: string;
  data: any;
  children: StaticTreeNode[];
};

interface DBOperations {
  select: <T>(query: string, params?: unknown[]) => Promise<T[]>;
  execute: (query: string, params?: unknown[]) => Promise<void>;
}

const getSchema = (tableName: string) => {
  return `
  CREATE TABLE IF NOT EXISTS ${tableName} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT UNIQUE,
    data TEXT
    -- TODO: depth INTEGER GENERATED ALWAYS AS (LENGTH(path) - LENGTH(REPLACE(path, '.', '')) + 1) STORED
  );
  CREATE INDEX IF NOT EXISTS idx_${tableName}_path ON ${tableName}(path);
  -- TODO: CREATE INDEX idx_nodes_depth ON nodes(depth);
  `;
};

export default class MPTree {
  tableName: string;
  dbSelect: DBOperations["select"];
  dbExecute: DBOperations["execute"];

  constructor(
    tableName: string = "nodes",
    dbSelect: DBOperations["select"],
    dbExecute: DBOperations["execute"]
  ) {
    this.dbSelect = dbSelect;
    this.dbExecute = dbExecute;

    const validate = (tableName: string) => {
      // must be alphanumeric
      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        throw new Error("Invalid table name");
      }
      // must not start with a number
      if (/^[0-9]/.test(tableName)) {
        throw new Error("Table name must not start with a number");
      }
      return tableName;
    };
    validate(tableName);
    this.tableName = tableName;
    this._init();
  }

  async _init() {
    console.log("Initializing MPTree");
    await this.dbExecute(getSchema(this.tableName));
  }

  async addNode(parentPath: string | null, nodeData: any): Promise<MPTreeNode> {
    const newPath = await getNextChildPath(
      this.dbSelect,
      this.tableName,
      parentPath
    );
    const jsonData = JSON.stringify(nodeData);

    const insertQuery = `INSERT INTO ${this.tableName} (path, data) VALUES (?, ?)`;
    await this.dbExecute(insertQuery, [newPath, jsonData]);

    return new MPTreeNode(
      newPath,
      nodeData,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async addRoot(nodeData: unknown) {
    return this.addNode(null, nodeData);
  }

  async updateNode(path: string, nodeData: any) {
    const jsonData = JSON.stringify(nodeData);

    const updateQuery = `UPDATE ${this.tableName} SET data = ? WHERE path = ?`;
    await this.dbExecute(updateQuery, [jsonData, path]);

    return new MPTreeNode(
      path,
      nodeData,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async deleteNode(path: string) {
    const deleteQuery = `DELETE FROM ${this.tableName} WHERE path = ? OR path LIKE ?`;
    await this.dbExecute(deleteQuery, [path, `${path}.%`]);
  }

  async getTree(parentPath: string | null = null) {
    const [query, params] =
      parentPath === null
        ? ["SELECT path, data FROM nodes", []]
        : [
            `SELECT path, data FROM ${this.tableName} WHERE path = ? OR path LIKE ?`,
            [parentPath, `${parentPath}.%`],
          ];

    const results = await this.dbSelect<NodeRow>(query, params);

    const nodes = results.map(
      (row) =>
        new MPTreeNode(
          row.path,
          row.data,
          this.tableName,
          this.dbSelect,
          this.dbExecute
        )
    );

    return this.buildTree(nodes);
  }

  buildTree(nodes: MPTreeNode[]): MPTreeNodeWithChildren | null {
    const nodeMap: { [key: string]: MPTreeNodeWithChildren } = {};

    nodes.forEach((node) => {
      nodeMap[node.path] = {
        node,
        children: [],
      };
    });

    const tree: MPTreeNodeWithChildren[] = [];

    nodes.forEach((node) => {
      const parentPath = node.path.split(".").slice(0, -1).join(".");
      if (parentPath && nodeMap[parentPath]) {
        nodeMap[parentPath].children.push(nodeMap[node.path]);
      } else {
        tree.push(nodeMap[node.path]); // Root-level node
      }
    });

    if (tree.length === 0) {
      console.error("No root node found");
      return null;
    } else if (tree.length === 1) {
      return tree[0];
    }
    return {
      node: new MPTreeNode(
        "__ROOT__",
        null,
        this.tableName,
        () => {
          throw new Error(
            "Cannot select from artificial root node (id = __ROOT__)"
          );
        },
        () => {
          throw new Error(
            "Cannot execute on artificial root node (id = __ROOT__)"
          );
        }
      ),
      children: tree,
    };
  }

  async getFirstRootNode() {
    const query = `SELECT path, data FROM ${this.tableName} WHERE path NOT LIKE '%.%' ORDER BY path ASC LIMIT 1`;

    const result = await this.dbSelect<NodeRow>(query);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return new MPTreeNode(
      row.path,
      row.data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getLastRootNode() {
    const query = `SELECT path, data FROM ${this.tableName} WHERE path NOT LIKE '%.%' ORDER BY path DESC LIMIT 1`;

    const result = await this.dbSelect<NodeRow>(query);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return new MPTreeNode(
      row.path,
      row.data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }

  async getRootNodes() {
    const query = `SELECT path, data FROM ${this.tableName} WHERE path NOT LIKE '%.%'`;

    const results = await this.dbSelect<NodeRow>(query);
    return results.map(
      (row) =>
        new MPTreeNode(
          row.path,
          row.data,
          this.tableName,
          this.dbSelect,
          this.dbExecute
        )
    );
  }

  async getNode(path: string) {
    const query = `SELECT path, data FROM ${this.tableName} WHERE path = ?`;

    const result = await this.dbSelect<NodeRow>(query, [path]);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return new MPTreeNode(
      row.path,
      row.data,
      this.tableName,
      this.dbSelect,
      this.dbExecute
    );
  }
}
