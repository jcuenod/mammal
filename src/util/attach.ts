import { invoke } from "@tauri-apps/api/core";

export const messageIsAttachment = (message: string) => {
  const trimmed = message.trim();
  return (
    trimmed.startsWith("<FILE_ATTACHMENT>") &&
    trimmed.endsWith("</FILE_ATTACHMENT>")
  );
};

export const getAttachmentTemplate = (filename: string, content: string) =>
  `<FILE_ATTACHMENT>
<FILE_NAME>
${filename}
</FILE_NAME>
<FILE_CONTENT>
${content}
</FILE_CONTENT>
</FILE_ATTACHMENT>`;

export const readDocument = async (path: string) =>
  await invoke<string>("get_file", { path });
