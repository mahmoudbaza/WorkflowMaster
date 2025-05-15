import { useState } from "react";
import AnnouncementSection from "@/components/Dashboard/AnnouncementSection";
import RequestsTable from "@/components/Dashboard/RequestsTable";
import WorkflowSection from "@/components/Dashboard/WorkflowSection";
import ApprovalsSection from "@/components/Dashboard/ApprovalsSection";
import DocumentsSection from "@/components/Dashboard/DocumentsSection";
import QuickLinksSection from "@/components/Dashboard/QuickLinksSection";
import NewRequestModal from "@/components/NewRequestModal";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  return (
    <>
      {/* Action Bar */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold text-neutral-700 mb-4 md:mb-0">Welcome, John</h2>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <Button
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={() => setShowNewRequestModal(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            New Request
          </Button>
          <div className="relative inline-block text-left">
            <Button
              variant="outline"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span>Quick Links</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>

      {/* Announcements */}
      <AnnouncementSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RequestsTable />
          <WorkflowSection />
        </div>

        <div className="space-y-6">
          <ApprovalsSection />
          <DocumentsSection />
          <QuickLinksSection />
        </div>
      </div>

      <NewRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
      />
    </>
  );
};

export default Dashboard;
