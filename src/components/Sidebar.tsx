// import { defaultState } from "./mainViewState";
import type { mainViewState } from "./mainViewState";
import { HomeIcon, MammalIcon, IconProps, Settings2Icon } from "./Icons";

type LinkProps = {
  Icon: React.FC<IconProps>;
  onClick: () => void;
  isActive: boolean;
};
const SidebarLink = ({ isActive, Icon, onClick }: LinkProps) => (
  <a
    className={
      "flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 rounded hover:bg-slate-300 active:scale-95" +
      (isActive ? " bg-slate-200" : "")
    }
    href="#"
    onClick={onClick}
  >
    <Icon className="w-5 h-5" />
  </a>
);

type SidebarProps = {
  state: mainViewState;
  setSidebarState: (state: mainViewState) => void;
};
export const Sidebar = ({ state, setSidebarState }: SidebarProps) => (
  <>
    <a
      className="flex items-center justify-center flex-shrink-0 w-full h-16 bg-slate-300"
      href="#"
    >
      <MammalIcon className="w-8 h-8" />
    </a>
    <SidebarLink
      isActive={state === "home"}
      Icon={HomeIcon}
      onClick={() => setSidebarState("home")}
    />
    {/* <SidebarLink Icon={DocumentIcon} />
    <SidebarLink Icon={InboxIcon} />
    <SidebarLink Icon={AnalyticsIcon} /> */}
    <SidebarLink
      isActive={state === "add-provider"}
      Icon={Settings2Icon}
      onClick={() => setSidebarState("add-provider")}
    />

    {/* <a
      className="flex items-center justify-center flex-shrink-0 w-10 h-10 mt-4 mt-auto rounded hover:bg-slate-300"
      href="#"
    >
      <svg
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </a> */}
  </>
);
