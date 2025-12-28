import React, { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { X, Plus, Maximize2, Check, Square, CheckSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

export const TodoItem = React.memo(({ todo, updateTodo, deleteTodo }) => {
  const nodeRef = useRef(null);
  const [items, setItems] = useState(todo.items || [{ id: Date.now(), text: '', completed: false }]);
  const [title, setTitle] = useState(todo.title || 'Todo List');
  
  const handleDrag = (e, dragData) => {
    updateTodo(todo.id, {
      position: { x: dragData.x, y: dragData.y }
    });
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    updateTodo(todo.id, { title: e.target.value });
  };

  const toggleItem = (itemId) => {
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    setItems(newItems);
    updateTodo(todo.id, { items: newItems });
  };

  const updateItemText = (itemId, text) => {
    const newItems = items.map(item =>
      item.id === itemId ? { ...item, text } : item
    );
    setItems(newItems);
    updateTodo(todo.id, { items: newItems });
  };

  const addItem = () => {
    const newItems = [...items, { id: Date.now(), text: '', completed: false }];
    setItems(newItems);
    updateTodo(todo.id, { items: newItems });
  };

  const deleteItem = (itemId) => {
    if (items.length > 1) {
      const newItems = items.filter(item => item.id !== itemId);
      setItems(newItems);
      updateTodo(todo.id, { items: newItems });
    }
  };

  const handleResize = (e) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = todo.size?.width || 280;
    const startHeight = todo.size?.height || 200;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      updateTodo(todo.id, {
        size: { 
          width: Math.max(200, startWidth + deltaX), 
          height: Math.max(120, startHeight + deltaY) 
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

  const completedCount = items.filter(i => i.completed).length;

  return (
    <Draggable
      nodeRef={nodeRef}
      position={todo.position}
      onStop={handleDrag}
      bounds="parent"
      handle=".todo-handle"
    >
      <div
        ref={nodeRef}
        className="absolute group"
        style={{
          width: todo.size?.width || 280,
          zIndex: 12
        }}
      >
        <Card className="overflow-hidden shadow-lg bg-gradient-to-br from-card to-primary/5">
          {/* Header */}
          <div className="todo-handle flex items-center justify-between px-3 py-2 bg-primary/10 cursor-move border-b border-border">
            <div className="flex items-center gap-2 flex-1">
              <CheckSquare className="h-4 w-4 text-primary" />
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
                placeholder="Todo List"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">{completedCount}/{items.length}</span>
              <Button
                variant="destructive"
                size="icon"
                className="h-5 w-5 ml-1"
                onClick={() => deleteTodo(todo.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Items */}
          <div 
            className="overflow-auto p-2 space-y-1"
            style={{ maxHeight: (todo.size?.height || 200) - 80 }}
          >
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-1.5 rounded-md transition-colors ${
                  item.completed ? 'bg-success/10' : 'hover:bg-muted/50'
                }`}
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="flex-shrink-0"
                >
                  {item.completed ? (
                    <CheckSquare className="h-4 w-4 text-success" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateItemText(item.id, e.target.value)}
                  className={`flex-1 bg-transparent text-sm focus:outline-none ${
                    item.completed ? 'line-through text-muted-foreground' : ''
                  }`}
                  placeholder="Add a task..."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteItem(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={addItem}
            >
              <Plus className="h-3 w-3 mr-1" /> Add Task
            </Button>
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

TodoItem.displayName = 'TodoItem';
export default TodoItem;
