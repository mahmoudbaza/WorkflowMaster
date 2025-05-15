import { useQuery } from "@tanstack/react-query";
import { Approval } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const ApprovalsSection = () => {
  const { data: approvals, isLoading } = useQuery<Approval[]>({
    queryKey: ["/api/approvals/pending"],
  });

  const { toast } = useToast();

  const handleApprove = async (approvalId: string) => {
    try {
      await apiRequest("POST", `/api/approvals/${approvalId}/approve`, {});
      toast({
        title: "Approval successful",
        description: "The request has been approved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await apiRequest("POST", `/api/approvals/${approvalId}/reject`, {});
      toast({
        title: "Rejection successful",
        description: "The request has been rejected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader className="px-4 py-3 border-b border-neutral-200 bg-[#ffb900] bg-opacity-10">
        <CardTitle className="font-semibold text-neutral-700 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-[#ffb900]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Pending Approvals ({approvals?.length || 0})
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 divide-y divide-neutral-200">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="py-3 first:pt-0 last:pb-0 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-5 bg-neutral-200 rounded w-48"></div>
                    <div className="h-4 bg-neutral-200 rounded w-36"></div>
                    <div className="h-4 bg-neutral-200 rounded w-32"></div>
                  </div>
                  <div className="h-6 bg-neutral-200 rounded-full w-16"></div>
                </div>
                <div className="mt-3 flex space-x-2">
                  <div className="h-8 bg-neutral-200 rounded flex-grow"></div>
                  <div className="h-8 bg-neutral-200 rounded flex-grow"></div>
                  <div className="h-8 bg-neutral-200 rounded w-16"></div>
                </div>
              </div>
            ))
        ) : !approvals || approvals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-500">No pending approvals at the moment.</p>
          </div>
        ) : (
          approvals.map((approval) => (
            <div key={approval.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-neutral-800">{approval.title}</h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    From: {approval.requesterName} • {approval.department}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Submitted: {new Date(approval.submittedDate).toLocaleDateString()}
                  </p>
                </div>
                {approval.isUrgent && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ffb900] bg-opacity-10 text-[#ffb900]">
                    Urgent
                  </span>
                )}
              </div>
              <div className="mt-3 flex space-x-2">
                <Button
                  className="px-3 py-1 bg-[#107c10] text-white text-xs rounded hover:bg-green-700 flex-grow"
                  onClick={() => handleApprove(approval.id)}
                >
                  Approve
                </Button>
                <Button
                  className="px-3 py-1 bg-[#a80000] text-white text-xs rounded hover:bg-red-700 flex-grow"
                  onClick={() => handleReject(approval.id)}
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="px-3 py-1 border border-neutral-300 text-neutral-700 text-xs rounded hover:bg-neutral-50"
                >
                  Details
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>

      <CardFooter className="px-4 py-3 border-t border-neutral-200 bg-neutral-50">
        <a
          href="/approvals"
          className="text-sm text-primary hover:text-primary-dark flex items-center justify-center w-full"
        >
          View all pending approvals
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      </CardFooter>
    </Card>
  );
};

export default ApprovalsSection;
