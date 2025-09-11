import React, { useState } from 'react';
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { cn } from '../utils/cn';

interface ImageViewerProps {
  imageData: string;
  mimeType: string;
  alt?: string;
  className?: string;
  showControls?: boolean;
  maxWidth?: string;
  maxHeight?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  imageData,
  mimeType,
  alt = '图片',
  className = '',
  showControls = true,
  maxWidth = '100%',
  maxHeight = 'auto'
}) => {
  console.log('ImageViewer组件渲染:', {
    imageDataLength: imageData?.length,
    mimeType,
    alt,
    showControls
  });
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const imageUrl = `data:${mimeType};base64,${imageData}`;

  if (hasError) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg",
        className
      )}>
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">图片加载失败</p>
        </div>
      </div>
    );
  }

  const imageContent = (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={cn(
          "transition-all duration-200 ease-in-out rounded-lg border shadow-sm",
          isFullscreen ? "cursor-move" : "cursor-default",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        style={{ 
          transform: `scale(${scale})`,
          maxWidth: isFullscreen ? 'none' : maxWidth,
          maxHeight: isFullscreen ? 'none' : maxHeight
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
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
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="重置"
            >
              <span className="text-xs font-medium">1:1</span>
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
          
          {/* 图片内容 */}
          <div className="flex items-center justify-center">
            {imageContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      {imageContent}
      
      {/* 控制按钮 */}
      {showControls && !isLoading && !hasError && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white bg-opacity-90 rounded-lg shadow-sm p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="缩小"
          >
            <MagnifyingGlassMinusIcon className="h-3 w-3" />
          </button>
          
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="放大"
          >
            <MagnifyingGlassPlusIcon className="h-3 w-3" />
          </button>
          
          <button
            onClick={handleFullscreen}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="全屏查看"
          >
            <ArrowsPointingOutIcon className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageViewer;