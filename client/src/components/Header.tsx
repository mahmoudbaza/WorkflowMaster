import { useLocation } from "wouter";
import { useState } from "react";
import NewRequestModal from "@/components/NewRequestModal";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [location] = useLocation();
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/my-requests":
        return "My Requests";
      case "/approvals":
        return "Approvals";
      case "/announcements":
        return "Announcements";
      case "/documents":
        return "My Documents";
      case "/admin":
        return "Admin Panel";
      case "/config":
        return "System Configuration";
      default:
        return "Internal Portal";
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm z-10">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center">
            <button
              className="text-neutral-500 hover:text-neutral-700 focus:outline-none"
              onClick={toggleSidebar}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="ml-4 flex">
              <h1 className="text-lg font-semibold text-neutral-700">{getPageTitle()}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-1 text-neutral-500 hover:text-neutral-700 focus:outline-none">
              <span className="sr-only">Search</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            <button className="p-1 text-neutral-500 hover:text-neutral-700 focus:outline-none relative">
              <span className="sr-only">Notifications</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-0 right-0 h-4 w-4 bg-[#a80000] rounded-full flex items-center justify-center text-xs text-white font-semibold">
                3
              </span>
            </button>

            <button className="p-1 text-neutral-500 hover:text-neutral-700 focus:outline-none">
              <span className="sr-only">Help</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <NewRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
      />
    </>
  );
};

export default Header;
