import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import MultiSelectDropdown from './MultiSelectDropdown';
import TaskEditorModal from './TaskEditorModal';
import '../styles/plannerBoard.css';

// Local storage key for selected columns (list names)
const LS_KEY = 'voik_planner_columns';
const MAX_COLUMNS = 5;

// Workaround for React 18 StrictMode with react-beautiful-dnd
const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

const PlannerBoard = ({ tasks, updateTaskList, moveTask }) => {
  const allListNames = useMemo(() => Object.keys(tasks || {}), [tasks]);

  // Initialize columns: from LS (filter unknown), else default ['Today']
  const [columns, setColumns] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length) {
          return saved.slice(0, MAX_COLUMNS);
        }
      }
    } catch {}
    return ['Today'];
  });

  // Reconcile columns when available lists change (e.g., after load)
  useEffect(() => {
    if (!allListNames.length) return;
    setColumns((prev) => {
      let next = (prev || []).filter((n) => allListNames.includes(n));
      if (next.length === 0) {
        const saved = (() => {
          try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr)) return arr.filter((n) => allListNames.includes(n));
            }
          } catch {}
          return [];
        })();
        if (saved.length) next = saved.slice(0, MAX_COLUMNS);
      }
      if (next.length === 0 && allListNames.includes('Today')) {
        next = ['Today'];
      }
      if (next.length > MAX_COLUMNS) next = next.slice(0, MAX_COLUMNS);
      const isSame = prev && prev.length === next.length && prev.every((v, i) => v === next[i]);
      return isSame ? prev : next;
    });
  }, [allListNames]);

  // Selected options for the dropdown; mirrors columns but order may be reset by DnD
  const selectedOptions = columns;

  const [selectedTask, setSelectedTask] = useState(null);
  const [newTaskByList, setNewTaskByList] = useState({});

  // Persist columns to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(columns));
    } catch {}
  }, [columns]);

  // Handle selection via dropdown (add/remove columns)
  const handleSelectColumns = (newSelection) => {
    // Compute added/removed relative to current columns
    const currentSet = new Set(columns);
    const nextSet = new Set(newSelection);

    // Limit to MAX_COLUMNS
    if (newSelection.length > MAX_COLUMNS) {
      alert(`Maximaal ${MAX_COLUMNS} kolommen toegestaan`);
      return; // ignore this change
    }

    // Removed columns
    const removed = columns.filter((c) => !nextSet.has(c));
    // Added columns (append to end)
    const added = newSelection.filter((c) => !currentSet.has(c));

    if (removed.length === 0 && added.length === 0) return;

    const next = columns.filter((c) => !removed.includes(c)).concat(added);
    setColumns(next);
  };

  const handleAddTask = (listName) => {
    const text = (newTaskByList[listName] || '').trim();
    if (!text) return;
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const title = text.split(/\r?\n/)[0].substring(0, 100);
    const newTask = { id, title, text, completed: false, createdAt: new Date().toISOString() };
    const current = Array.from(tasks[listName]?.items || []);
    const items = [newTask, ...current];
    updateTaskList(listName, { items });
    setNewTaskByList((prev) => ({ ...prev, [listName]: '' }));
  };

  const onDragEnd = (result) => {
    const { source, destination, type, draggableId } = result;
    if (!destination) return;

    // Reorder columns
    if (type === 'COLUMN') {
      const next = Array.from(columns);
      const [removed] = next.splice(source.index, 1);
      next.splice(destination.index, 0, removed);
      setColumns(next);
      return;
    }

    // Moving tasks between/within lists
    if (type === 'TASK') {
      const sourceList = source.droppableId.replace('list-', '');
      const destList = destination.droppableId.replace('list-', '');

      // Safety: ensure lists exist
      if (!tasks[sourceList]) return;

      if (sourceList === destList) {
        // Reorder within same list
        const items = Array.from(tasks[sourceList]?.items || []);
        const fromIndex = source.index;
        const toIndex = destination.index;
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
        updateTaskList(sourceList, { items });
      } else {
        // Move across lists — insert at specific index in destination
        const sourceItems = Array.from(tasks[sourceList]?.items || []);
        const destItems = Array.from(tasks[destList]?.items || []);
        const [moved] = sourceItems.splice(source.index, 1);
        if (!moved) return;
        destItems.splice(destination.index, 0, moved);
        // Update both lists
        updateTaskList(sourceList, { items: sourceItems });
        updateTaskList(destList, { items: destItems });
      }
    }
  };

  // Render a compact task card
  const TaskCard = ({ task, listName, index }) => {
    // Extract title from HTML text as fallback
    const getTitle = (html) => {
      if (!html) return '';
      const div = document.createElement('div');
      div.innerHTML = html;
      const text = div.textContent || div.innerText || '';
      return text.split(/\r?\n/)[0];
    };
    const title = task.title || getTitle(task.text) || 'Taak';

    // Full text for tooltip (first line full length)
    const getFullTitle = (html) => {
      if (!html) return '';
      const div = document.createElement('div');
      div.innerHTML = html;
      const text = div.textContent || div.innerText || '';
      return text.split(/\r?\n/)[0];
    };
    const fullTitle = task.title || getFullTitle(task.text) || '';

    const toggleComplete = (e) => {
      e.stopPropagation();
      const items = (tasks[listName]?.items || []).map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      );
      updateTaskList(listName, { items });
    };

    const deleteTask = (e) => {
      e.stopPropagation();
      const items = (tasks[listName]?.items || []).filter((t) => t.id !== task.id);
      updateTaskList(listName, { items });
    };

    return (
      <Draggable draggableId={`${listName}::${String(task.id)}`} index={index}>
        {(provided) => (
          <div
            className={`pb-task ${task.completed ? 'is-completed' : ''}`}
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={provided.draggableProps.style}
            onClick={() => setSelectedTask({ ...task, list: listName })}
          >
            <input
              className="pb-task-checkbox"
              type="checkbox"
              checked={!!task.completed}
              onChange={toggleComplete}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="pb-task-title" title={fullTitle}>{title}</div>
            <div className="pb-task-tooltip">{fullTitle}</div>
            <button className="pb-task-delete" onClick={deleteTask} title="Verwijderen" aria-label="Verwijderen">×</button>
          </div>
        )}
      </Draggable>
    );
  };

  const availableToAdd = allListNames;

  return (
    <div className="pb-container">
      <div className="pb-toolbar">
        <div className="pb-toolbar-left">
          <div className="pb-title">Board</div>
          <div className="pb-hint hide-on-mobile">Sleep kolommen om te herordenen</div>
        </div>
        <div className="pb-toolbar-right">
          <MultiSelectDropdown
            options={availableToAdd}
            selectedOptions={selectedOptions}
            onChange={handleSelectColumns}
            placeholder="Kolommen kiezen"
          />
          <div className="pb-counter">{columns.length}/{MAX_COLUMNS}</div>
        </div>
      </div>

      {columns.length === 0 ? (
        <div style={{ padding: 16 }}>Geen kolommen geselecteerd.</div>
      ) : (
      <DragDropContext onDragEnd={onDragEnd}>
        {/* Columns reorder */}
        <StrictModeDroppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div className="pb-board" ref={provided.innerRef} {...provided.droppableProps}>
              {columns.map((listName, colIndex) => (
                <Draggable key={listName} draggableId={`col-${listName}`} index={colIndex}>
                  {(colProvided) => (
                    <div
                      className="pb-column"
                      ref={colProvided.innerRef}
                      {...colProvided.draggableProps}
                      style={colProvided.draggableProps.style}
                    >
                      <div className="pb-column-header" {...colProvided.dragHandleProps}>
                        <span className="pb-column-title" title={listName}>{listName}</span>
                      </div>
                      <div className="pb-add">
                        <input
                          className="pb-add-input"
                          type="text"
                          value={newTaskByList[listName] || ''}
                          placeholder="Add task..."
                          onChange={(e) => setNewTaskByList((prev) => ({ ...prev, [listName]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTask(listName);
                            }
                          }}
                        />
                        <button className="pb-add-btn" onClick={() => handleAddTask(listName)} title="Add">+</button>
                      </div>
                      {/* Tasks droppable */}
                      <StrictModeDroppable droppableId={`list-${listName}`} type="TASK">
                        {(taskDropProvided) => (
                          <div
                            className="pb-tasks"
                            ref={taskDropProvided.innerRef}
                            {...taskDropProvided.droppableProps}
                          >
                            {(tasks[listName]?.items || []).map((task, index) => (
                              <TaskCard key={task.id} task={task} listName={listName} index={index} />)
                            )}
                            {taskDropProvided.placeholder}
                          </div>
                        )}
                      </StrictModeDroppable>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </StrictModeDroppable>
      </DragDropContext>
      )}

      {selectedTask && (
        <TaskEditorModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          updateTaskList={(updatedTask) => {
            const list = updatedTask.list;
            const items = (tasks[list]?.items || []).map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
            updateTaskList(list, { items });
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default PlannerBoard;
