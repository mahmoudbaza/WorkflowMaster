import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Announcement } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const AnnouncementSection = () => {
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  return (
    <Card className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
      <CardHeader className="bg-primary px-4 py-3 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
        <CardTitle className="ml-2 text-white font-semibold">
          Company Announcements
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="animate-pulse flex flex-col md:flex-row bg-neutral-50 rounded-lg overflow-hidden border border-neutral-200">
              <div className="md:w-1/4 lg:w-1/5 h-32 bg-neutral-200"></div>
              <div className="p-4 md:w-3/4 lg:w-4/5 space-y-3">
                <div className="h-6 bg-neutral-200 rounded"></div>
                <div className="h-4 bg-neutral-200 rounded"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ) : !announcements || announcements.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-neutral-500">No announcements at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`flex flex-col md:flex-row ${
                  announcement.isNew
                    ? "bg-neutral-50"
                    : "bg-white"
                } rounded-lg overflow-hidden border border-neutral-200`}
              >
                <div className="md:w-1/4 lg:w-1/5 min-h-[120px]">
                  {announcement.imageUrl && (
                    <img
                      src={announcement.imageUrl}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4 md:w-3/4 lg:w-4/5">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-lg text-neutral-800">
                      {announcement.title}
                    </h4>
                    {announcement.isNew && (
                      <span className="text-xs bg-[#0078d4] text-white px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-600 text-sm mt-2">
                    {announcement.content}
                  </p>
                  <div className="flex items-center mt-3 text-sm">
                    <span className="text-neutral-500">
                      Posted by: {announcement.author}
                    </span>
                    <span className="mx-2 text-neutral-300">|</span>
                    <span className="text-neutral-500">
                      {new Date(announcement.date).toLocaleDateString()}
                    </span>
                    <button className="ml-auto text-primary hover:text-primary-dark">
                      Read more
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementSection;
