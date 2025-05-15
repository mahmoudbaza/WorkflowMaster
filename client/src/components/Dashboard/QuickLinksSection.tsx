import { useQuery } from "@tanstack/react-query";
import { QuickLink } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const QuickLinksSection = () => {
  const { data: quickLinks, isLoading } = useQuery<QuickLink[]>({
    queryKey: ["/api/quicklinks"],
  });

  return (
    <Card className="bg-white rounded-lg shadow-sm">
      <CardHeader className="px-4 py-3 border-b border-neutral-200">
        <CardTitle className="font-semibold text-neutral-700">Quick Access</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <svg
              viewBox="0 0 600 200"
              className="w-full h-32 object-cover rounded-lg"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="100%" height="100%" fill="#f5f7fa" />
              <g transform="translate(100, 100)">
                {/* Stylized office workspace */}
                <rect x="-50" y="-40" width="400" height="80" rx="5" fill="#e1e7ef" />
                <rect x="0" y="-30" width="150" height="60" fill="#fff" stroke="#0078d4" strokeWidth="2" />
                <rect x="170" y="-30" width="150" height="60" fill="#fff" stroke="#0078d4" strokeWidth="2" />
                <rect x="20" y="-20" width="110" height="10" rx="2" fill="#0078d4" />
                <rect x="20" y="-5" width="70" height="5" rx="2" fill="#0078d4" opacity="0.7" />
                <rect x="20" y="5" width="90" height="5" rx="2" fill="#0078d4" opacity="0.7" />
                <rect x="20" y="15" width="60" height="5" rx="2" fill="#0078d4" opacity="0.7" />
                <rect x="190" y="-20" width="110" height="10" rx="2" fill="#0078d4" />
                <rect x="190" y="-5" width="70" height="5" rx="2" fill="#0078d4" opacity="0.7" />
                <rect x="190" y="5" width="90" height="5" rx="2" fill="#0078d4" opacity="0.7" />
                <rect x="190" y="15" width="60" height="5" rx="2" fill="#0078d4" opacity="0.7" />
              </g>
            </svg>
          </div>
          
          {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => (
                <div key={i} className={`flex flex-col items-center justify-center p-3 bg-neutral-50 rounded-lg border border-neutral-200 animate-pulse ${i === 4 || i === 5 ? "col-span-1" : ""}`}>
                  <div className="h-6 w-6 bg-neutral-200 rounded-full mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded w-16"></div>
                </div>
              ))
          ) : !quickLinks || quickLinks.length === 0 ? (
            <div className="col-span-2 text-center py-4">
              <p className="text-neutral-500">No quick links configured.</p>
            </div>
          ) : (
            <>
              {quickLinks.map((link, index) => (
                <a
                  key={link.id}
                  href={link.url}
                  className={`flex flex-col items-center justify-center p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:bg-neutral-100 transition-colors ${
                    index === quickLinks.length - 1 && quickLinks.length % 2 === 1
                      ? "col-span-2"
                      : ""
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.iconPath} />
                  </svg>
                  <span className="text-xs text-neutral-700 text-center">{link.title}</span>
                </a>
              ))}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickLinksSection;
