import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Request } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewRequestModal from "@/components/NewRequestModal";
import { format } from "date-fns";

const MyRequests = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  const { data: requests, isLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests"],
  });

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success";
      case "pending approval":
        return "warning";
      case "requires action":
        return "danger";
      case "rejected":
        return "danger";
      case "in progress":
        return "info";
      default:
        return "default";
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type.toLowerCase()) {
      case "it":
        return "primary";
      case "hr":
        return "success";
      case "finance":
        return "info";
      case "legal":
        return "purple";
      default:
        return "default";
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const filteredRequests = requests
    ? requests.filter((request) => {
        const matchesSearch =
          searchQuery === "" ||
          request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.title.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesType = typeFilter === "all" || request.type.toLowerCase() === typeFilter.toLowerCase();
        
        const matchesStatus = statusFilter === "all" || request.status.toLowerCase() === statusFilter.toLowerCase();
        
        return matchesSearch && matchesType && matchesStatus;
      })
    : [];

  return (
    <>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-xl font-semibold text-neutral-700 mb-4 md:mb-0">My Requests</h2>
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
      </div>

      <Card className="bg-white rounded-lg shadow-sm mb-6">
        <CardHeader className="px-4 py-3 border-b border-neutral-200">
          <CardTitle className="font-semibold text-neutral-700">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search by ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="in progress">In Progress</SelectItem>
                  <SelectItem value="requires action">Requires Action</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <Card className="bg-white rounded-lg shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-neutral-200">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                      >
                        Request ID & Title
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                      >
                        Submitted
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                      >
                        Last Updated
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-200">
                    {isLoading ? (
                      Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="h-4 bg-neutral-200 rounded w-28 mb-2"></div>
                              <div className="h-3 bg-neutral-200 rounded w-36"></div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="h-6 bg-neutral-200 rounded w-16"></div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="h-6 bg-neutral-200 rounded w-28"></div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="h-4 bg-neutral-200 rounded w-24"></div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="h-4 bg-neutral-200 rounded w-24"></div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="h-4 bg-neutral-200 rounded w-16"></div>
                            </td>
                          </tr>
                        ))
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-6 text-sm text-center text-neutral-500"
                        >
                          No requests found. Create a new request to get started.
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => (
                        <tr key={request.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-neutral-700">#{request.id}</div>
                            <div className="text-xs text-neutral-500">{request.title}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge variant={getTypeVariant(request.type)}>
                              {request.type}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge variant={getStatusVariant(request.status)}>
                              {request.status}
                            </StatusBadge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                            {formatDate(request.createdAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                            {formatDate(request.updatedAt)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <a
                              href={`/my-requests/${request.id}`}
                              className="text-primary hover:text-primary-dark mr-3"
                            >
                              View
                            </a>
                            {request.status === "Requires Action" && (
                              <a
                                href={`/my-requests/${request.id}/sign`}
                                className="text-[#a80000] hover:text-red-700"
                              >
                                Sign
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="mt-0">
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-neutral-500">Pending requests tab content</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="mt-0">
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-neutral-500">Active requests tab content</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <Card className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-center text-neutral-500">Completed requests tab content</p>
          </Card>
        </TabsContent>
      </Tabs>

      <NewRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
      />
    </>
  );
};

export default MyRequests;
