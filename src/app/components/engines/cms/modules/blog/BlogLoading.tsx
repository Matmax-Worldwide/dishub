export function BlogLoading() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
        
              <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3 animate-pulse"></div>
              
              <div className="flex items-center text-xs text-gray-500 space-x-3 mb-3">
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
            </div>
            
            <div className="border-t border-gray-100 bg-gray-50 p-2 flex justify-between">
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="flex space-x-2">
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
} 