import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { X, Plus, Minus, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export const TableItem = React.memo(({ table, updateTable, deleteTable }) => {
  const nodeRef = useRef(null);
  const [data, setData] = useState(table.data || [['', '', ''], ['', '', ''], ['', '', '']]);
  
  const handleDrag = (e, dragData) => {
    updateTable(table.id, {
      position: { x: dragData.x, y: dragData.y }
    });
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = data.map((row, rIdx) =>
      row.map((cell, cIdx) =>
        rIdx === rowIndex && cIdx === colIndex ? value : cell
      )
    );
    setData(newData);
    updateTable(table.id, { data: newData });
  };

  const addRow = () => {
    const newRow = new Array(data[0]?.length || 3).fill('');
    const newData = [...data, newRow];
    setData(newData);
    updateTable(table.id, { data: newData, rows: newData.length });
  };

  const addColumn = () => {
    const newData = data.map(row => [...row, '']);
    setData(newData);
    updateTable(table.id, { data: newData, cols: newData[0].length });
  };

  const removeRow = () => {
    if (data.length > 1) {
      const newData = data.slice(0, -1);
      setData(newData);
      updateTable(table.id, { data: newData, rows: newData.length });
    }
  };

  const removeColumn = () => {
    if (data[0]?.length > 1) {
      const newData = data.map(row => row.slice(0, -1));
      setData(newData);
      updateTable(table.id, { data: newData, cols: newData[0].length });
    }
  };

  const handleResize = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = table.size?.width || 400;
    const startHeight = table.size?.height || 200;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      updateTable(table.id, {
        size: { 
          width: Math.max(200, startWidth + deltaX), 
          height: Math.max(100, startHeight + deltaY) 
        }
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={table.position}
      onStop={handleDrag}
      bounds="parent"
      handle=".table-handle"
    >
      <div
        ref={nodeRef}
        className="absolute group"
        style={{
          width: table.size?.width || 400,
          zIndex: 12
        }}
      >
        <Card className="overflow-hidden shadow-lg">
          {/* Header */}
          <div className="table-handle flex items-center justify-between px-3 py-2 bg-muted/50 cursor-move border-b">
            <span className="text-xs font-medium">Table</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={addColumn}
                title="Add column"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={removeColumn}
                title="Remove column"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-5 w-5 ml-1"
                onClick={() => deleteTable(table.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto" style={{ maxHeight: (table.size?.height || 200) - 40 }}>
            <table className="w-full border-collapse text-sm">
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border border-border p-0">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                          className="w-full h-8 px-2 bg-transparent focus:outline-none focus:bg-primary/5 text-xs"
                          placeholder="..."
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-t">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={addRow}
              >
                <Plus className="h-3 w-3 mr-1" /> Row
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={removeRow}
              >
                <Minus className="h-3 w-3 mr-1" /> Row
              </Button>
            </div>
            <div
              className="w-4 h-4 cursor-se-resize"
              onMouseDown={handleResize}
            >
              <Maximize2 className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>
          </div>
        </Card>
      </div>
    </Draggable>
  );
});

TableItem.displayName = 'TableItem';
export default TableItem;
