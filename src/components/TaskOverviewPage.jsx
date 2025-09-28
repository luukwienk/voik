import React, { useState, useEffect } from 'react';
import TaskFilters from './TaskFilters';
import TaskTable from './TaskTable';
import TaskEditorModal from './TaskEditorModal';
import PlannerBoard from './PlannerBoard';

const TaskOverviewPage = ({ tasks, updateTaskList, moveTask }) => {
  // State voor zoeken en filteren
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLists, setSelectedLists] = useState(['All Lists']);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [view, setView] = useState('table'); // 'table' | 'board'
  
  // Alle beschikbare lijstnamen voor de filter
  const availableLists = ['All Lists', ...Object.keys(tasks)];
  
  // Effect voor het filteren van taken wanneer filters of taken veranderen
  useEffect(() => {
    const allTasks = [];
    
    // Verwerk de taken-data structuur en bouw allTasks array op
    Object.keys(tasks).forEach(listName => {
      if (tasks[listName] && tasks[listName].items) {
        tasks[listName].items.forEach(task => {
          allTasks.push({
            ...task,
            list: listName
          });
        });
      }
    });
    
    // Filter taken op basis van zoekterm en geselecteerde lijsten
    const filtered = allTasks.filter(task => {
      let taskContent = task.text;
      
      // Als de taak in JSON-formaat is opgeslagen, probeer de tekstinhoud te extraheren
      try {
        const parsedContent = JSON.parse(task.text);
        if (parsedContent.blocks && parsedContent.blocks.length > 0) {
          taskContent = parsedContent.blocks.map(block => block.text).join(' ');
        }
      } catch (e) {
        // Als er een fout is bij het parsen, gebruik de originele tekst
        taskContent = task.text;
      }
      
      const matchesSearch = taskContent.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesList = selectedLists.includes('All Lists') || selectedLists.includes(task.list);
      
      return matchesSearch && matchesList;
    });
    
    setFilteredTasks(filtered);
  }, [tasks, searchTerm, selectedLists]);
  
  // Functie om een taak te verwijderen
  const handleDeleteTask = (task) => {
    if (window.confirm(`Weet je zeker dat je deze taak wilt verwijderen?`)) {
      const updatedItems = tasks[task.list].items.filter(t => t.id !== task.id);
      updateTaskList(task.list, { items: updatedItems });
    }
  };
  
  // Functie om taakstatus te wijzigen
  const handleToggleCompletion = (task) => {
    const updatedTask = {
      ...task,
      completed: !task.completed
    };
    
    const updatedItems = tasks[task.list].items.map(t => 
      t.id === task.id ? updatedTask : t
    );
    
    updateTaskList(task.list, { items: updatedItems });
  };

  // Functie om meerdere taken naar een andere lijst te verplaatsen
  const handleMoveTasksToList = (tasksToMove, targetList) => {
    // Controleer of de doellijst bestaat
    if (!tasks[targetList]) {
      alert(`De lijst "${targetList}" bestaat niet.`);
      return;
    }

    // Groepeer taken per bronlijst
    const tasksBySourceList = tasksToMove.reduce((acc, task) => {
      if (!acc[task.list]) {
        acc[task.list] = [];
      }
      acc[task.list].push(task);
      return acc;
    }, {});

    // Verwerk elke bronlijst
    Object.entries(tasksBySourceList).forEach(([sourceList, tasksInList]) => {
      // Verwijder alle taken uit de bronlijst
      const updatedSourceItems = tasks[sourceList].items.filter(
        t => !tasksInList.some(task => task.id === t.id)
      );
      updateTaskList(sourceList, { items: updatedSourceItems });

      // Voeg alle taken toe aan de doellijst
      const tasksWithNewList = tasksInList.map(task => ({ ...task, list: targetList }));
      const updatedTargetItems = [...tasks[targetList].items, ...tasksWithNewList];
      updateTaskList(targetList, { items: updatedTargetItems });
    });

    // Geen alert hier, dit gebeurt al in de TaskTable component
  };
  
  // Functie om gefilterde taken te exporteren als Markdown
  const handleExport = () => {
    if (!filteredTasks.length) {
      alert('Geen taken om te exporteren.');
      return;
    }
    const markdown = filteredTasks.map(task => {
      const status = task.completed ? 'x' : ' ';
      // Titel of eerste regel van de tekst
      let title = task.title || '';
      if (!title && task.text) {
        try {
          const parsed = JSON.parse(task.text);
          if (parsed.blocks && parsed.blocks.length > 0) {
            title = parsed.blocks[0].text;
          }
        } catch {
          title = task.text.split(/\r?\n/)[0];
        }
      }
      return `- [${status}] ${title} (${task.list})`;
    }).join('\n');
    navigator.clipboard.writeText(markdown).then(() => {
      alert('Taken gekopieerd als Markdown!');
    });
  };
  
  return (
    <div className="task-overview-page" style={{ 
      padding: '20px',
      height: 'calc(100vh - 120px)',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* View toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setView('table')}
            style={{
              background: view === 'table' ? '#2196F3' : '#f5f7fa',
              color: view === 'table' ? '#fff' : '#2196F3',
              border: '1px solid #e0e7ef',
              borderRadius: 6,
              padding: '6px 12px',
              boxShadow: 'none',
              fontSize: 14
            }}
          >
            Tabel
          </button>
          <button
            onClick={() => setView('board')}
            style={{
              background: view === 'board' ? '#2196F3' : '#f5f7fa',
              color: view === 'board' ? '#fff' : '#2196F3',
              border: '1px solid #e0e7ef',
              borderRadius: 6,
              padding: '6px 12px',
              boxShadow: 'none',
              fontSize: 14
            }}
          >
            Board
          </button>
        </div>
        {/* Exportknop alleen zichtbaar op desktop en alleen in Tabel view */}
        {view === 'table' && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="hide-on-mobile" onClick={handleExport} style={{
              background: '#f5f7fa',
              border: '1px solid #e0e7ef',
              borderRadius: '4px',
              padding: '6px 16px',
              color: '#2196F3',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '15px',
              boxShadow: 'none',
              opacity: 0.85
            }} title="Taken exporteren als Markdown">
              📤 Exporteren
            </button>
          </div>
        )}
      </div>
      {view === 'table' ? (
        <>
          {/* Filter component */}
          <TaskFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            availableLists={availableLists}
            selectedLists={selectedLists}
            setSelectedLists={setSelectedLists}
          />
          {/* Tabel component */}
          <TaskTable 
            tasks={filteredTasks}
            availableLists={Object.keys(tasks)}
            onSelectTask={setSelectedTask}
            onToggleCompletion={handleToggleCompletion}
            onDeleteTask={handleDeleteTask}
            onMoveTasksToList={handleMoveTasksToList}
          />
        </>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <PlannerBoard tasks={tasks} updateTaskList={updateTaskList} moveTask={moveTask} />
        </div>
      )}
      
      {/* Modal component */}
      {selectedTask && (
        <TaskEditorModal 
          task={selectedTask}
          tasks={tasks}
          onClose={() => setSelectedTask(null)} 
          updateTaskList={(updatedTask) => {
            const list = updatedTask.list;
            const updatedItems = tasks[list].items.map(t => 
              t.id === updatedTask.id ? updatedTask : t
            );
            updateTaskList(list, { items: updatedItems });
          }}
        />
      )}
      {/* CSS voor hide-on-mobile */}
      <style>{`
        .hide-on-mobile { display: inline-block; }
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default TaskOverviewPage;
