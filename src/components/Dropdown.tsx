import { forwardRef, useEffect, useRef, useState } from "react";
import { ChevronsUpDownIcon } from "./Icons";

type MenuOption = {
  id: number;
  active: boolean;
  label: string;
  onClick: () => void;
};

const MenuOption = ({ active, label, onClick }: MenuOption) => (
  <a
    className={
      "w-full pl-4 pr-8 py-2 text-left active:bg-slate-400 rounded whitespace-nowrap " +
      (active ? "bg-slate-200 hover:bg-slate-300" : "hover:bg-slate-200")
    }
    onClick={onClick}
    tabIndex={0} // make it focusable
  >
    {label}
  </a>
);

type DropdownProps = {
  label: React.ReactNode | string;
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  ({ label, children, isOpen, setIsOpen }, ref) => {
    return (
      <div className="relative text-sm" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          onBlur={(e) => {
            // only close if e.relatedTarget is not a child of the dropdown menu
            // this is to prevent the dropdown from closing when clicking on a menu item
            const $dropdownSubmenu = e.currentTarget.nextElementSibling;
            const contains = $dropdownSubmenu?.contains(
              e.relatedTarget as Node
            );
            if (!contains) {
              setIsOpen(false);
            }
          }}
          className={
            "rounded active:bg-slate-400" +
            (isOpen
              ? " bg-slate-200 hover:bg-slate-300"
              : " hover:bg-slate-200")
          }
        >
          {label}
        </button>
        <div
          className="absolute left-0 flex flex-col items-start min-w-40 rounded-md mt-1 p-1 border-slate-200 bg-white shadow-lg space-y-0.5"
          style={{
            borderWidth: "1px",
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transition: "all 80ms ease-in-out",
            transform: isOpen
              ? "translateY(0) scale(1)"
              : "translateY(2rem) scale(0.95)",
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

type ComboBoxProps = {
  selectedOptionIndex: number;
  menuOptions: MenuOption[];
};
export const ComboBox = ({
  selectedOptionIndex,
  menuOptions,
}: ComboBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      label={
        <div className="h-10 px-4 flex items-center">
          <div>{menuOptions[selectedOptionIndex]?.label || "Select"}</div>
          <ChevronsUpDownIcon className="w-5 h-5 ml-2" />
        </div>
      }
    >
      {menuOptions.map((option) => (
        <MenuOption
          key={option.label + "_" + option.id}
          {...option}
          onClick={() => {
            option.onClick();
            setIsOpen(false);
          }}
        />
      ))}
    </Dropdown>
  );
};

type IconMenuProps = {
  icon: React.ReactNode;
  children: React.ReactNode;
};
export const IconMenu = ({ icon, children }: IconMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blurHandler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", blurHandler);
    return () => document.removeEventListener("click", blurHandler);
  }, []);

  return (
    <Dropdown
      ref={ref}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      label={
        <div className="h-10 w-10 flex items-center justify-center">{icon}</div>
      }
    >
      {children}
    </Dropdown>
  );
};
