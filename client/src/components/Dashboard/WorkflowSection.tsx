import { useQuery } from "@tanstack/react-query";
import { Workflow } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

const WorkflowSection = () => {
  const { data: workflows, isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows/active"],
  });

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "on track":
        return "success";
      case "delayed":
        return "danger";
      case "waiting for input":
        return "warning";
      case "completed":
        return "info";
      default:
        return "default";
    }
  };

  const calculateProgressWidth = (workflow: Workflow) => {
    if (!workflow.steps || workflow.steps.length === 0) return "0%";
    
    const completed = workflow.steps.filter(step => step.isCompleted).length;
    return `${(completed / workflow.steps.length) * 100}%`;
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader className="px-4 py-3 border-b border-neutral-200">
        <CardTitle className="font-semibold text-neutral-700">
          Active Workflows
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {isLoading ? (
          Array(2)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="border border-neutral-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-2">
                    <div className="h-5 bg-neutral-200 rounded w-64"></div>
                    <div className="h-4 bg-neutral-200 rounded w-48"></div>
                  </div>
                  <div className="h-6 bg-neutral-200 rounded w-20"></div>
                </div>
                <div className="relative">
                  <div className="h-2 bg-neutral-200 rounded mb-4"></div>
                  <div className="flex justify-between items-center">
                    {Array(4)
                      .fill(0)
                      .map((_, j) => (
                        <div key={j} className="flex flex-col items-center">
                          <div className="h-6 w-6 rounded-full bg-neutral-200"></div>
                          <div className="h-3 bg-neutral-200 rounded w-16 mt-1"></div>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="bg-neutral-50 rounded p-3 mt-4 border border-neutral-200">
                  <div className="flex items-center">
                    <div className="h-5 w-5 bg-neutral-200 rounded-full mr-2"></div>
                    <div className="h-4 bg-neutral-200 rounded flex-grow"></div>
                    <div className="h-8 bg-neutral-200 rounded w-20 ml-auto"></div>
                  </div>
                </div>
              </div>
            ))
        ) : !workflows || workflows.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-500">No active workflows at the moment.</p>
          </div>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.id} className="border border-neutral-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-neutral-800">{workflow.title}</h4>
                  <span className="text-xs text-neutral-500">
                    Started: {new Date(workflow.startDate).toLocaleDateString()} | 
                    Due: {new Date(workflow.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <StatusBadge variant={getStatusVariant(workflow.status)}>
                  {workflow.status}
                </StatusBadge>
              </div>

              <div className="relative">
                {/* Progress bar */}
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-neutral-200">
                  <div
                    style={{ width: calculateProgressWidth(workflow) }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                  ></div>
                </div>

                {/* Step indicators */}
                <div className="flex justify-between items-center">
                  {workflow.steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className={`h-6 w-6 rounded-full ${
                          step.isCompleted ? "bg-primary" : "bg-neutral-300"
                        } text-white flex items-center justify-center text-xs font-semibold`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-xs mt-1 text-neutral-600">
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {workflow.nextAction && (
                <div className="bg-neutral-50 rounded p-3 mt-4 border border-neutral-200">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${
                        workflow.nextAction.isUrgent
                          ? "text-[#a80000]"
                          : "text-[#d83b01]"
                      } mr-2`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm text-neutral-700">
                      {workflow.nextAction.text}
                    </span>
                    <button className="ml-auto text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark">
                      {workflow.nextAction.actionText}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowSection;
