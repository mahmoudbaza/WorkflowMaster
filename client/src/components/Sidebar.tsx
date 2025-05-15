import { Link, useLocation } from "wouter";

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar = ({ collapsed }: SidebarProps) => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path ? "active" : "";
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-16 md:w-64'} bg-white shadow-md flex flex-col h-screen z-10`}>
      <div className="p-4 border-b border-neutral-200 flex items-center justify-center md:justify-start">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-bold">IP</div>
        <span className={`ml-3 text-lg font-semibold ${collapsed ? 'hidden' : 'hidden md:block'}`}>Internal Portal</span>
      </div>
      
      <nav className="flex-1 overflow-y-auto pt-4">
        <div className="px-2 space-y-1">
          {/* Dashboard */}
          <Link href="/" className={`sidebar-item ${isActive("/")} flex items-center px-2 py-3 text-neutral-500 hover:bg-neutral-100 rounded-md group transition-all`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className={`${collapsed ? 'hidden' : 'hidden md:block'}`}>Dashboard</span>
          </Link>
          
          {/* My Requests */}
          <Link href="/my-requests" className={`sidebar-item ${isActive("/my-requests")} flex items-center px-2 py-3 text-neutral-500 hover:bg-neutral-100 rounded-md group transition-all`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className={`${collapsed ? 'hidden' : 'hidden md:block'}`}>My Requests</span>
          </Link>
          
          {/* Approvals */}
          <Link href="/approvals" className={`sidebar-item ${isActive("/approvals")} flex items-center px-2 py-3 text-neutral-500 hover:bg-neutral-100 rounded-md group transition-all`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`${collapsed ? 'hidden' : 'hidden md:block'}`}>Approvals</span>
            <span className={`ml-auto bg-[#ffb900] text-white text-xs font-medium px-2 py-0.5 rounded-full ${collapsed ? 'hidden' : 'hidden md:block'}`}>5</span>
          </Link>
          
          {/* Announcements */}
          <Link href="/announcements" className={`sidebar-item ${isActive("/announcements")} flex items-center px-2 py-3 text-neutral-500 hover:bg-neutral-100 rounded-md group transition-all`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <span className={`${collapsed ? 'hidden' : 'hidden md:block'}`}>Announcements</span>
            <span className={`ml-auto bg-[#0078d4] text-white text-xs font-medium px-2 py-0.5 rounded-full ${collapsed ? 'hidden' : 'hidden md:block'}`}>New</span>
          </Link>
          
          {/* Documents */}
          <Link href="/documents" className={`sidebar-item ${isActive("/documents")} flex items-center px-2 py-3 text-neutral-500 hover:bg-neutral-100 rounded-md group transition-all`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className={`${collapsed ? 'hidden' : 'hidden md:block'}`}>My Documents</span>
          </Link>
        </div>
        
        <div className="px-2 pt-6 mt-6 border-t border-neutral-200">
          <h3 className={`px-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider ${collapsed ? 'hidden' : 'hidden md:block'}`}>
            Administration
          </h3>
          
          {/* Admin Panel */}
          <Link href="/admin" className={`sidebar-item ${isActive("/admin")} flex items-center px-2 py-3 mt-1 text-neutral-500 hover:bg-neutral-100 rounded-md group transition-all`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className={`${collapsed ? 'hidden' : 'hidden md:block'}`}>Admin Panel</span>
          </Link>
          
          {/* Config */}
          <Link href="/config" className={`sidebar-item ${isActive("/config")} flex items-center px-2 py-3 text-neutral-500 hover:bg-neutral-100 rounded-md group transition-all`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="sidebar-icon h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className={`${collapsed ? 'hidden' : 'hidden md:block'}`}>System Configuration</span>
          </Link>
        </div>
      </nav>
      
      <div className="p-4 border-t border-neutral-200">
        <div className="flex items-center">
          <div className={`h-8 w-8 rounded-full bg-neutral-300 flex items-center justify-center text-white ${collapsed ? 'block' : 'hidden md:block'}`}>JS</div>
          <div className={`ml-3 ${collapsed ? 'hidden' : 'hidden md:block'}`}>
            <p className="text-sm font-medium text-neutral-700">John Smith</p>
            <p className="text-xs text-neutral-500">IT Administrator</p>
          </div>
          <button className="ml-auto text-neutral-400 hover:text-neutral-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
