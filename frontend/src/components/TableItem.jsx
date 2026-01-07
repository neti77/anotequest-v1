import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { X, Plus, Minus, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export const TableItem = React.memo(({ table, updateTable, deleteTable, zoom = 1, shouldDeleteOnDrop }) => {
  const nodeRef = useRef(null);
  const [data, setData] = useState(
    table.data || [['', '', ''], ['', '', ''], ['', '', '']]
  );

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = data.map((row, r) =>
      row.map((cell, c) => (r === rowIndex && c === colIndex ? value : cell))
    );
    setData(newData);
    updateTable(table.id, { data: newData });
  };

  const addRow = () => {
    const newData = [...data, new Array(data[0].length).fill('')];
    setData(newData);
    updateTable(table.id, { data: newData });
  };

  const addColumn = () => {
    const newData = data.map(row => [...row, '']);
    setData(newData);
    updateTable(table.id, { data: newData });
  };

  const removeRow = () => {
    if (data.length > 1) {
      const newData = data.slice(0, -1);
      setData(newData);
      updateTable(table.id, { data: newData });
    }
  };

  const removeColumn = () => {
    if (data[0].length > 1) {
      const newData = data.map(row => row.slice(0, -1));
      setData(newData);
      updateTable(table.id, { data: newData });
    }
  };

  const handleResize = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = table.size?.width || 400;
    const startHeight = table.size?.height || 200;

    const handleMove = (ev) => {
      updateTable(table.id, {
        size: {
          width: Math.max(200, startWidth + (ev.clientX - startX)),
          height: Math.max(120, startHeight + (ev.clientY - startY))
        }
      });
    };

    const stop = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', stop);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', stop);
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      position={table.position}
      scale={zoom}
      onStop={(e, data) => {
        if (shouldDeleteOnDrop && shouldDeleteOnDrop(e)) {
          deleteTable(table.id);
        } else {
          updateTable(table.id, {
            position: { x: data.x, y: data.y },
          });
        }
      }}
    >

      <div
        ref={nodeRef}
        className="absolute cursor-move"
        style={{
          width: table.size?.width || 400,
          zIndex: 12
        }}
      >
        <Card className="overflow-hidden shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
            <span className="text-xs font-medium">Table</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={addColumn}>
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" onClick={removeColumn}>
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => deleteTable(table.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-auto" style={{ maxHeight: table.size?.height || 200 }}>
            <table className="w-full border-collapse text-xs">
              <tbody>
                {data.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) => (
                      <td key={c} className="border border-border">
                        <input
                          value={cell}
                          onChange={(e) => handleCellChange(r, c, e.target.value)}
                          className="w-full h-8 px-2 bg-transparent focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t">
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={addRow}>+ Row</Button>
              <Button size="sm" variant="ghost" onClick={removeRow}>− Row</Button>
            </div>
            <div
              className="cursor-se-resize opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center"
              onMouseDown={handleResize}
            >
              <Maximize2 className="h-3 w-3 text-muted-foreground rotate-90" />
            </div>
          </div>
        </Card>
      </div>
    </Draggable>
  );
});

export default TableItem;
