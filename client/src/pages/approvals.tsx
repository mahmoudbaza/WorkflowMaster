import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Approval } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Approvals = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: approvals, isLoading } = useQuery<Approval[]>({
    queryKey: ["/api/approvals"],
  });

  const { toast } = useToast();

  const handleApprove = async (approvalId: string) => {
    try {
      await apiRequest("POST", `/api/approvals/${approvalId}/approve`, {});
      
      // Invalidate the cache to refresh the approvals list
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      
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
      
      // Invalidate the cache to refresh the approvals list
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      
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

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const filteredApprovals = approvals
    ? approvals.filter((approval) => {
        const matchesSearch =
          searchQuery === "" ||
          approval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          approval.requesterName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = typeFilter === "all" || approval.department.toLowerCase() === typeFilter.toLowerCase();
        
        // Date filtering can be enhanced based on your requirements
        return matchesSearch && matchesType;
      })
    : [];

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-700">Pending Approvals</h2>
        <p className="text-neutral-500 mt-1">Review and approve or reject requests</p>
      </div>

      <Card className="bg-white rounded-lg shadow-sm mb-6">
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search by title or requester..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="it">IT Department</SelectItem>
                  <SelectItem value="hr">HR Department</SelectItem>
                  <SelectItem value="finance">Finance Department</SelectItem>
                  <SelectItem value="legal">Legal Department</SelectItem>
                  <SelectItem value="marketing">Marketing Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="lastWeek">Last Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-0">
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-2">
                            <div className="h-5 bg-neutral-200 rounded w-64"></div>
                            <div className="h-4 bg-neutral-200 rounded w-48"></div>
                            <div className="h-4 bg-neutral-200 rounded w-36"></div>
                          </div>
                          <div className="h-6 bg-neutral-200 rounded-full w-20"></div>
                        </div>
                        <div className="flex space-x-3 mt-4">
                          <div className="h-9 bg-neutral-200 rounded flex-grow"></div>
                          <div className="h-9 bg-neutral-200 rounded flex-grow"></div>
                          <div className="h-9 bg-neutral-200 rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : filteredApprovals.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-neutral-500">No pending approvals found.</p>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  {filteredApprovals.map((approval) => (
                    <div key={approval.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-neutral-800 text-lg">{approval.title}</h4>
                          <p className="text-sm text-neutral-600 mt-1">
                            From: {approval.requesterName} • {approval.department}
                          </p>
                          <p className="text-sm text-neutral-500">
                            Submitted: {formatDate(approval.submittedDate)}
                          </p>
                          <div className="mt-2 text-sm">
                            <p className="text-neutral-600">{approval.description}</p>
                          </div>
                        </div>
                        {approval.isUrgent && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#ffb900] bg-opacity-10 text-[#ffb900]">
                            Urgent
                          </span>
                        )}
                      </div>
                      
                      {approval.attachments && approval.attachments.length > 0 && (
                        <div className="mt-3 border-t border-neutral-200 pt-3">
                          <p className="text-sm font-medium text-neutral-700">Attachments:</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {approval.attachments.map((attachment, index) => (
                              <a
                                key={index}
                                href={attachment.url}
                                className="text-sm text-primary hover:text-primary-dark flex items-center"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {attachment.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 flex space-x-3">
                        <Button
                          className="bg-[#107c10] text-white rounded hover:bg-green-700 flex-grow"
                          onClick={() => handleApprove(approval.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          className="bg-[#a80000] text-white rounded hover:bg-red-700 flex-grow"
                          onClick={() => handleReject(approval.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          className="border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-50"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved" className="mt-0">
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-neutral-500">Approved requests history</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-0">
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-neutral-500">Rejected requests history</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="all" className="mt-0">
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-neutral-500">All approval history</p>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};

export default Approvals;
