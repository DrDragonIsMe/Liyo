import React, { useState } from 'react';
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';

interface SVGViewerProps {
  svgData: string;
  title?: string;
  className?: string;
  showControls?: boolean;
}

const SVGViewer: React.FC<SVGViewerProps> = ({
  svgData,
  title = '几何图形',
  className = '',
  showControls = true
}) => {
  console.log('SVGViewer组件渲染:', {
    svgDataLength: svgData?.length,
    svgDataPreview: svgData?.substring(0, 100),
    title,
    showControls
  });
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setIsFullscreen(false);
    setScale(1);
  };

  const svgContent = (
    <div 
      className={cn(
        "transition-transform duration-200 ease-in-out",
        isFullscreen ? "cursor-move" : "cursor-default"
      )}
      style={{ transform: `scale(${scale})` }}
      dangerouslySetInnerHTML={{ __html: svgData }}
    />
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="relative bg-white rounded-lg p-6 max-w-[90vw] max-h-[90vh] overflow-auto">
          {/* 全屏控制栏 */}
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow-lg p-2 z-10">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="缩小"
            >
              <MagnifyingGlassMinusIcon className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600 min-w-[3rem] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="放大"
            >
              <MagnifyingGlassPlusIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleReset}
              className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="重置"
            >
              重置
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <button
              onClick={handleCloseFullscreen}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="关闭全屏"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
          
          {/* SVG内容 */}
          <div className="flex items-center justify-center min-h-[400px]">
            {svgContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* 控制栏 */}
        {showControls && (
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-medium text-gray-700">{title}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="缩小"
              >
                <MagnifyingGlassMinusIcon className="h-3.5 w-3.5" />
              </button>
              
              <span className="text-xs text-gray-600 min-w-[2.5rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              
              <button
                onClick={handleZoomIn}
                disabled={scale >= 3}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="放大"
              >
                <MagnifyingGlassPlusIcon className="h-3.5 w-3.5" />
              </button>
              
              <button
                onClick={handleReset}
                className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title="重置"
              >
                重置
              </button>
              
              <button
                onClick={handleFullscreen}
                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title="全屏查看"
              >
                <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
        
        {/* SVG内容区域 */}
        <div 
          className="flex items-center justify-center p-6"
          style={{ minHeight: '200px', minWidth: '300px' }}
        >
          {svgContent}
        </div>
      </div>
    </div>
  );
};

export default SVGViewer;