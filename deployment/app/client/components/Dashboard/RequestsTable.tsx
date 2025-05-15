import { useQuery } from "@tanstack/react-query";
import { Request } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

const RequestsTable = () => {
  const { data: requests, isLoading } = useQuery<Request[]>({
    queryKey: ["/api/requests/recent"],
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
    const requestDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (requestDate.toDateString() === today.toDateString()) {
      return `Today, ${format(requestDate, "h:mm a")}`;
    } else if (requestDate.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(requestDate, "h:mm a")}`;
    } else {
      return format(requestDate, "MMM d, yyyy");
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm mb-6">
      <CardHeader className="px-4 py-3 border-b border-neutral-200 flex justify-between items-center">
        <CardTitle className="font-semibold text-neutral-700">
          My Recent Requests
        </CardTitle>
        <a href="/my-requests" className="text-sm text-primary hover:text-primary-dark">
          View all
        </a>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                >
                  Request
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
                  Updated
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
                Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-4 bg-neutral-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-32"></div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-6 bg-neutral-200 rounded w-12"></div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-6 bg-neutral-200 rounded w-28"></div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-4 bg-neutral-200 rounded w-24"></div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="h-4 bg-neutral-200 rounded w-12"></div>
                      </td>
                    </tr>
                  ))
              ) : !requests || requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-sm text-center text-neutral-500"
                  >
                    No requests found. Create a new request to get started.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-neutral-700">
                        #{request.id}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {request.title}
                      </div>
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
  );
};

export default RequestsTable;
