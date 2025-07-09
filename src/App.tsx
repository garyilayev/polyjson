import { useState, useRef, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { darkenColor, generateColor, generateId } from "./util";

type Point = { x: number; y: number };
type Polygon = Point[];

interface PolygonData {
  id: string;
  label?: string;
  shape?: string;
  fillColor: string;
  strokeColor: string;
  coords: number[];
  polygon: Polygon;
}

type DrawingMode = "line" | "rectangle" | "circle";

export default function ImagePolygonAnnotator() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>("line");
  const [label, setLabel] = useState<string>("");
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [dragShape, setDragShape] = useState<Polygon | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const formattedPolygons = polygons.map((polygon) => ({
    id: polygon.id,
    label: polygon.label,
    shape: polygon.shape,
    fillColor: polygon.fillColor,
    strokeColor: polygon.strokeColor,
    coords: polygon.coords,
  }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setPolygons([]);
        setCurrentPolygon([]);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please upload an image file");
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    if (drawingMode === "line") {
      setCurrentPolygon((prev) => [...prev, { x, y }]);
    } else {
      setStartPoint({ x, y });
      setDragShape(null); // reset preview
    }
  };

  const handleMouseUp = () => {
    if (drawingMode === "line" || !dragShape || !startPoint) return;

    const fillColor = generateColor(0.5); // force 0.5 alpha for final polygon
    const newPoly: PolygonData = {
      id: generateId(),
      label,
      shape: drawingMode,
      fillColor,
      strokeColor: darkenColor(fillColor, 1),
      coords: dragShape.flatMap(({ x, y }) => [x, y]),
      polygon: dragShape,
    };

    setPolygons((prev) => [...prev, newPoly]);
    setDragShape(null);
    setStartPoint(null);
    setLabel("");
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!startPoint || drawingMode === "line") return;

    const { x, y } = getCanvasCoordinates(e);
    const endPoint = { x, y };
    let shape: Polygon = [];

    if (drawingMode === "rectangle") {
      shape = [
        startPoint,
        { x: endPoint.x, y: startPoint.y },
        endPoint,
        { x: startPoint.x, y: endPoint.y },
      ];
    } else if (drawingMode === "circle") {
      const radiusX = (endPoint.x - startPoint.x) / 2;
      const radiusY = (endPoint.y - startPoint.y) / 2;
      const centerX = startPoint.x + radiusX;
      const centerY = startPoint.y + radiusY;
      const steps = 32;
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        shape.push({
          x: centerX + radiusX * Math.cos(angle),
          y: centerY + radiusY * Math.sin(angle),
        });
      }
    }

    setDragShape(shape); // preview polygon
  };

  const completePolygon = () => {
    if (currentPolygon.length >= 3) {
      const fillColor = generateColor(0.5); // force semi-transparent fill
      const newPolygonData: PolygonData = {
        id: generateId(),
        label,
        shape: "poly",
        fillColor,
        strokeColor: darkenColor(fillColor, 1),
        coords: currentPolygon.flatMap((point) => [point.x, point.y]),
        polygon: currentPolygon,
      };
      setPolygons((prev) => [...prev, newPolygonData]);
      setCurrentPolygon([]);

      setLabel("");
      toast.success("Polygon completed");
    } else {
      toast.error("Need at least 3 points to complete a polygon");
    }
  };

  const clearPolygons = () => {
    setPolygons([]);
    setCurrentPolygon([]);

    toast.success("Polygons cleared 🧼");
  };

  const clearCurrent = () => {
    setCurrentPolygon([]);

    toast("Drawing cleared", { icon: "🗑️" });
  };

  const exportJSON = () => {
    navigator.clipboard.writeText(
      JSON.stringify({ polygons, currentPolygon }, null, 2)
    );
    toast.success("JSON copied to clipboard");
  };

  const getPolygonCenter = (polygon: Point[]): Point => {
    const total = polygon.reduce(
      (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
      { x: 0, y: 0 }
    );
    return {
      x: total.x / polygon.length,
      y: total.y / polygon.length,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const image = imageRef.current;
    if (!canvas || !ctx || !image || !imageSrc) return;

    const draw = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw finalized polygons with 0.5 opacity
      polygons.forEach((polyData) => {
        const points = polyData.polygon;
        if (points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          points.forEach((point) => ctx.lineTo(point.x, point.y));
          ctx.closePath();

          ctx.strokeStyle = polyData.strokeColor;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Set fill color with 0.5 opacity
          ctx.fillStyle = polyData.fillColor.replace(
            /rgba\\((\\d+),\\s*(\\d+),\\s*(\\d+),\\s*[^)]+\\)/,
            "rgba($1, $2, $3, 0.5)"
          );
          ctx.fill();

          // Draw label at center
          if (polyData.label) {
            const center = getPolygonCenter(points);
            ctx.fillStyle = "black";
            ctx.font = "16px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(polyData.label, center.x, center.y);
          }
        }
      });

      // Draw polygon in line mode
      if (currentPolygon.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
        currentPolygon.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2;
        ctx.stroke();

        currentPolygon.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#EF4444";
          ctx.fill();
        });
      }

      // Draw drag preview with 0.25 opacity
      if (dragShape && dragShape.length > 0) {
        ctx.beginPath();
        ctx.moveTo(dragShape[0].x, dragShape[0].y);
        dragShape.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.closePath();

        ctx.strokeStyle = "#555";
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(0, 0, 255, 0.25)";
        ctx.fill();
        ctx.stroke();
      }
    };

    image.onload = draw;
    if (image.complete) draw();
    return () => {
      image.onload = null;
    };
  }, [polygons, currentPolygon, dragShape, imageSrc]);

  return (
    <div className="min-h-screen bg-gray-100 p-8 w-full">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl text-center font-bold text-gray-800">
          Image Polygon Annotator
        </h1>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Upload Image:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex gap-6 items-center bg-gray-50 p-4 rounded-lg border border-gray-300">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Mode
              </label>
              <select
                value={drawingMode}
                onChange={(e) => setDrawingMode(e.target.value as DrawingMode)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="line">Line (Polygon)</option>
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Name your polygon"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="relative flex justify-center items-center bg-gray-50 rounded-lg p-4 min-h-[400px]">
            {!imageSrc ? (
              <div className="text-gray-500 text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-2" />
                <p>Upload an image to start</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Uploaded"
                  className="max-w-full max-h-[500px] object-contain"
                />
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                />
              </div>
            )}
          </div>

          {imageSrc && (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={completePolygon}
                disabled={currentPolygon.length < 3}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-200 disabled:cursor-not-allowed"
              >
                Complete Polygon
              </button>
              <button
                onClick={clearCurrent}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Clear Current
              </button>
              <button
                onClick={clearPolygons}
                disabled={polygons.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:cursor-pointer hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                Clear all polygons
              </button>
              <button
                onClick={exportJSON}
                disabled={polygons.length === 0 && currentPolygon.length === 0}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
              >
                Export JSON
              </button>
            </div>
          )}

          {(polygons.length > 0 || currentPolygon.length > 0) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Current Data
              </h2>
              <pre className="text-sm text-gray-600 overflow-x-auto">
                {JSON.stringify(
                  { polygons: formattedPolygons, currentPolygon },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
