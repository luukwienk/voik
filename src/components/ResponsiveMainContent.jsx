// ResponsiveMainContent.jsx - Updated tab indices for Board-first layout
import TaskList from './TaskList';
import TaskOverviewPage from './TaskOverviewPage';
import HealthTabNavigator from './health/HealthTabNavigator';
import SuccessTracker from './success/succesTracker';
import TranscriptionTab from './TranscriptionTab';
import ChatButton from './ChatButton';
import ErrorBoundary from './ErrorBoundary';
import BigCalendarView from './BigCalendarView';
import useMediaQuery from '../hooks/useMediaQuery';
import '../styles/responsive.css';
import '../styles/centeredLayout.css';
import '../styles/chat.css';
import PlannerBoard from './PlannerBoard';

// New tab indices:
// 0 = Board (main view)
// 1 = Transcriptions
// 2 = Tasks
// 3 = Calendar
// 4 = Search
// 5 = Health
// 6 = Success

function ResponsiveMainContent({
  currentTab,
  tasks,
  currentTaskList,
  setCurrentTaskList,
  updateTaskList,
  addTaskList,
  deleteTaskList,
  moveTask,
  user,
  signOut,
  // Health tracking props
  healthData,
  healthLoading,
  addHealthEntry,
  updateHealthEntry,
  deleteHealthEntry,
  getHealthDataByDateRange,
  getLatestEntry,
  calculateWeeklyAverage,
  calculateTrend,
  // Chat props
  chatProps,
  isChatModalOpen,
  setIsChatModalOpen
}) {
  // Detect if device is an iPad
  const isIPad = /iPad/.test(navigator.userAgent) ||
                (/Macintosh/.test(navigator.userAgent) && 'ontouchend' in document);

  // Consider iPad as mobile for our layout
  const isDesktop = useMediaQuery('(min-width: 768px)') && !isIPad;

  const handleTasksExtracted = (tasksToAdd) => {
    if (tasksToAdd && tasksToAdd.length > 0) {
      const currentItems = tasks[currentTaskList]?.items || [];
      const newTasks = tasksToAdd.map(text => ({
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: text,
        title: text.split('\n')[0].substring(0, 50),
        completed: false,
        createdAt: new Date().toISOString()
      }));
      const updatedItems = [...currentItems, ...newTasks];
      updateTaskList(currentTaskList, { items: updatedItems });
    }
  };

  const mainStyle = {
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    height: 'calc(100vh - 130px)',
    overflowY: 'auto'
  };

  // Tab 0: Board (main view)
  if (currentTab === 0) {
    return (
      <ErrorBoundary>
        <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={{
          ...mainStyle,
          overflowY: 'hidden'
        }}>
          <PlannerBoard
            tasks={tasks}
            updateTaskList={updateTaskList}
            addTaskList={addTaskList}
            moveTask={moveTask}
            user={user}
          />

          {/* Chat button */}
          <div className="chat-button-container">
            {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  // Tab 1: Transcriptions
  if (currentTab === 1) {
    return (
      <ErrorBoundary>
        <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={mainStyle}>
          <TranscriptionTab user={user} onTasksExtracted={handleTasksExtracted} />

          <div className="chat-button-container">
            {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  // Tab 2: Tasks
  if (currentTab === 2) {
    return (
      <ErrorBoundary>
        <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={mainStyle}>
          <div style={{ marginTop: 24 }}>
            <TaskList
              tasks={tasks[currentTaskList]}
              currentList={currentTaskList}
              lists={tasks}
              moveTask={moveTask}
              hideTitleHeader={false}
              setCurrentList={setCurrentTaskList}
              addList={addTaskList}
              deleteList={deleteTaskList}
              updateList={(updatedData) => {
                if (updatedData.id && updatedData.list) {
                  updateTaskList(updatedData);
                } else {
                  updateTaskList(currentTaskList, updatedData);
                }
              }}
              signOut={signOut}
            />
          </div>

          <div className="chat-button-container">
            {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  // Tab 3: Calendar
  if (currentTab === 3) {
    return (
      <ErrorBoundary>
        <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={mainStyle}>
          {isDesktop ? (
            <BigCalendarView
              tasks={tasks}
              currentTaskList={currentTaskList}
              moveTask={moveTask}
            />
          ) : (
            <div style={{padding: '20px', textAlign: 'center'}}>
              <p>Calendar view is optimized for desktop.</p>
              <p>Please use the desktop version for full calendar functionality.</p>
            </div>
          )}

          <div className="chat-button-container">
            {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  // Tab 4: Search
  if (currentTab === 4) {
    return (
      <ErrorBoundary>
        <TaskOverviewPage
          tasks={tasks}
          currentTaskList={currentTaskList}
          updateTaskList={updateTaskList}
          moveTask={moveTask}
        />
      </ErrorBoundary>
    );
  }

  // Tab 5: Health
  if (currentTab === 5) {
    return (
      <ErrorBoundary>
        <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={mainStyle}>
          <HealthTabNavigator
            healthData={healthData}
            healthLoading={healthLoading}
            addHealthEntry={addHealthEntry}
            updateHealthEntry={updateHealthEntry}
            deleteHealthEntry={deleteHealthEntry}
            getHealthDataByDateRange={getHealthDataByDateRange || (() => {})}
            getLatestEntry={getLatestEntry || (() => {})}
            calculateWeeklyAverage={calculateWeeklyAverage || (() => {})}
            calculateTrend={calculateTrend || (() => {})}
          />

          <div className="chat-button-container">
            {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  // Tab 6: Success
  if (currentTab === 6) {
    return (
      <ErrorBoundary>
        <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={mainStyle}>
          <SuccessTracker userId={user?.uid} />

          <div className="chat-button-container">
            {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
          </div>
        </main>
      </ErrorBoundary>
    );
  }

  // Fallback - show board
  return (
    <ErrorBoundary>
      <main className={`responsive-container ${!isDesktop ? 'mobile-full-width' : ''}`} style={{
        ...mainStyle,
        overflowY: 'hidden'
      }}>
        <PlannerBoard
          tasks={tasks}
          updateTaskList={updateTaskList}
          addTaskList={addTaskList}
          moveTask={moveTask}
          user={user}
        />

        <div className="chat-button-container">
          {!isChatModalOpen && <ChatButton onClick={() => setIsChatModalOpen(true)} />}
        </div>
      </main>
    </ErrorBoundary>
  );
}

export default ResponsiveMainContent;
