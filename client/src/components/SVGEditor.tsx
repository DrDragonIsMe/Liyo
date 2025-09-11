import React, { useState, useRef, useEffect } from 'react';
import {
  PencilIcon,
  RectangleStackIcon,
  CircleStackIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface SVGEditorProps {
  initialSvg?: string;
  onSvgChange: (svg: string) => void;
  width?: number;
  height?: number;
}

interface Shape {
  id: string;
  type: 'line' | 'circle' | 'rectangle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  x2?: number;
  y2?: number;
  text?: string;
  stroke: string;
  strokeWidth: number;
  fill: string;
}

const SVGEditor: React.FC<SVGEditorProps> = ({
  initialSvg = '',
  onSvgChange,
  width = 400,
  height = 300
}) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedTool, setSelectedTool] = useState<'line' | 'circle' | 'rectangle' | 'text'>('line');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('none');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showPreview, setShowPreview] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // 初始化SVG数据
  useEffect(() => {
    if (initialSvg) {
      try {
        // 解析初始SVG数据并转换为shapes
        // 这里可以根据需要实现SVG解析逻辑
        console.log('Loading initial SVG:', initialSvg);
      } catch (error) {
        console.error('Failed to parse initial SVG:', error);
      }
    }
  }, [initialSvg]);

  // 生成SVG字符串
  const generateSVG = () => {
    const svgContent = shapes.map(shape => {
      switch (shape.type) {
        case 'line':
          return `<line x1="${shape.x}" y1="${shape.y}" x2="${shape.x2}" y2="${shape.y2}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" />`;
        case 'circle':
          return `<circle cx="${shape.x}" cy="${shape.y}" r="${shape.radius}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" fill="${shape.fill}" />`;
        case 'rectangle':
          return `<rect x="${shape.x}" y="${shape.y}" width="${shape.width}" height="${shape.height}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" fill="${shape.fill}" />`;
        case 'text':
          return `<text x="${shape.x}" y="${shape.y}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" fill="${shape.fill}">${shape.text}</text>`;
        default:
          return '';
      }
    }).join('\n');

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n${svgContent}\n</svg>`;
    return svg;
  };

  // 更新SVG
  useEffect(() => {
    const svg = generateSVG();
    onSvgChange(svg);
  }, [shapes, width, height]);

  // 获取鼠标位置
  const getMousePosition = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // 开始绘制
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getMousePosition(e);
    setIsDrawing(true);

    const newShape: Shape = {
      id: Date.now().toString(),
      type: selectedTool,
      x: pos.x,
      y: pos.y,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      fill: fillColor
    };

    if (selectedTool === 'circle') {
      newShape.radius = 0;
    } else if (selectedTool === 'rectangle') {
      newShape.width = 0;
      newShape.height = 0;
    } else if (selectedTool === 'line') {
      newShape.x2 = pos.x;
      newShape.y2 = pos.y;
    } else if (selectedTool === 'text') {
      newShape.text = '文本';
      setShapes(prev => [...prev, newShape]);
      setIsDrawing(false);
      return;
    }

    setCurrentShape(newShape);
  };

  // 绘制过程中
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !currentShape) return;

    const pos = getMousePosition(e);
    const updatedShape = { ...currentShape };

    if (selectedTool === 'circle') {
      const radius = Math.sqrt(
        Math.pow(pos.x - currentShape.x, 2) + Math.pow(pos.y - currentShape.y, 2)
      );
      updatedShape.radius = radius;
    } else if (selectedTool === 'rectangle') {
      updatedShape.width = Math.abs(pos.x - currentShape.x);
      updatedShape.height = Math.abs(pos.y - currentShape.y);
      updatedShape.x = Math.min(currentShape.x, pos.x);
      updatedShape.y = Math.min(currentShape.y, pos.y);
    } else if (selectedTool === 'line') {
      updatedShape.x2 = pos.x;
      updatedShape.y2 = pos.y;
    }

    setCurrentShape(updatedShape);
  };

  // 结束绘制
  const handleMouseUp = () => {
    if (isDrawing && currentShape) {
      setShapes(prev => [...prev, currentShape]);
      setCurrentShape(null);
    }
    setIsDrawing(false);
  };

  // 删除选中的形状
  const deleteSelectedShape = () => {
    if (selectedShape) {
      setShapes(prev => prev.filter(shape => shape.id !== selectedShape));
      setSelectedShape(null);
    }
  };

  // 清空画布
  const clearCanvas = () => {
    setShapes([]);
    setSelectedShape(null);
  };

  // 导出SVG
  const exportSVG = () => {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'geometry.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      {/* 工具栏 */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTool('line')}
            className={`p-2 rounded-lg transition-colors ${
              selectedTool === 'line'
                ? 'bg-blue-100 text-blue-600 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="直线"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedTool('rectangle')}
            className={`p-2 rounded-lg transition-colors ${
              selectedTool === 'rectangle'
                ? 'bg-blue-100 text-blue-600 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="矩形"
          >
            <RectangleStackIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedTool('circle')}
            className={`p-2 rounded-lg transition-colors ${
              selectedTool === 'circle'
                ? 'bg-blue-100 text-blue-600 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="圆形"
          >
            <CircleStackIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedTool('text')}
            className={`p-2 rounded-lg transition-colors ${
              selectedTool === 'text'
                ? 'bg-blue-100 text-blue-600 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="文本"
          >
            T
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
            title="预览"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={exportSVG}
            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
            title="导出SVG"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
          </button>
          <button
            onClick={deleteSelectedShape}
            disabled={!selectedShape}
            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="删除选中"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="清空画布"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 样式控制 */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">线条颜色:</label>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">填充颜色:</label>
          <input
            type="color"
            value={fillColor === 'none' ? '#ffffff' : fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
          />
          <button
            onClick={() => setFillColor('none')}
            className={`px-2 py-1 text-xs rounded ${
              fillColor === 'none'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            无填充
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">线条粗细:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-gray-600">{strokeWidth}px</span>
        </div>
      </div>

      {/* SVG画布 */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="border border-gray-300 bg-white cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* 渲染已保存的形状 */}
          {shapes.map(shape => {
            switch (shape.type) {
              case 'line':
                return (
                  <line
                    key={shape.id}
                    x1={shape.x}
                    y1={shape.y}
                    x2={shape.x2}
                    y2={shape.y2}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    className={selectedShape === shape.id ? 'opacity-75' : ''}
                    onClick={() => setSelectedShape(shape.id)}
                  />
                );
              case 'circle':
                return (
                  <circle
                    key={shape.id}
                    cx={shape.x}
                    cy={shape.y}
                    r={shape.radius}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.fill}
                    className={selectedShape === shape.id ? 'opacity-75' : ''}
                    onClick={() => setSelectedShape(shape.id)}
                  />
                );
              case 'rectangle':
                return (
                  <rect
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.fill}
                    className={selectedShape === shape.id ? 'opacity-75' : ''}
                    onClick={() => setSelectedShape(shape.id)}
                  />
                );
              case 'text':
                return (
                  <text
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    stroke={shape.stroke}
                    strokeWidth={shape.strokeWidth}
                    fill={shape.fill}
                    className={selectedShape === shape.id ? 'opacity-75' : ''}
                    onClick={() => setSelectedShape(shape.id)}
                  >
                    {shape.text}
                  </text>
                );
              default:
                return null;
            }
          })}

          {/* 渲染当前正在绘制的形状 */}
          {currentShape && (
            <>
              {currentShape.type === 'line' && (
                <line
                  x1={currentShape.x}
                  y1={currentShape.y}
                  x2={currentShape.x2}
                  y2={currentShape.y2}
                  stroke={currentShape.stroke}
                  strokeWidth={currentShape.strokeWidth}
                  opacity={0.7}
                />
              )}
              {currentShape.type === 'circle' && (
                <circle
                  cx={currentShape.x}
                  cy={currentShape.y}
                  r={currentShape.radius}
                  stroke={currentShape.stroke}
                  strokeWidth={currentShape.strokeWidth}
                  fill={currentShape.fill}
                  opacity={0.7}
                />
              )}
              {currentShape.type === 'rectangle' && (
                <rect
                  x={currentShape.x}
                  y={currentShape.y}
                  width={currentShape.width}
                  height={currentShape.height}
                  stroke={currentShape.stroke}
                  strokeWidth={currentShape.strokeWidth}
                  fill={currentShape.fill}
                  opacity={0.7}
                />
              )}
            </>
          )}
        </svg>

        {/* 预览模式 */}
        {showPreview && (
          <div className="absolute top-0 left-0 w-full h-full bg-white bg-opacity-90 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg border">
              <h3 className="text-lg font-semibold mb-2">SVG预览</h3>
              <div dangerouslySetInnerHTML={{ __html: generateSVG() }} />
            </div>
          </div>
        )}
      </div>

      {/* 形状列表 */}
      {shapes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">图形列表 ({shapes.length})</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {shapes.map(shape => (
              <div
                key={shape.id}
                className={`flex items-center justify-between p-2 rounded text-sm ${
                  selectedShape === shape.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedShape(shape.id)}
              >
                <span>
                  {shape.type === 'line' && '直线'}
                  {shape.type === 'circle' && '圆形'}
                  {shape.type === 'rectangle' && '矩形'}
                  {shape.type === 'text' && `文本: ${shape.text}`}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShapes(prev => prev.filter(s => s.id !== shape.id));
                    if (selectedShape === shape.id) {
                      setSelectedShape(null);
                    }
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SVGEditor;