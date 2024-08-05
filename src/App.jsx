import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import './App.css';
import Header from './components/Header';
import MainContent from './components/MainContent';
import { useAuth } from './hooks/useAuth';
import { useLists } from './hooks/useLists';
import { useVoiceInput } from './hooks/useVoiceInput';
import SignIn from './SignIn';
import { initClient } from './services/googleCalendar';

function App() {
  const { user, signOut } = useAuth();
  const { lists, currentList, setCurrentList, addList, deleteList, updateList } = useLists(user);
  const { recognizedText, aiResponse, isLoading, error, handleVoiceInput, setRecognizedText } = useVoiceInput(lists, currentList, updateList);
  const [currentTab, setCurrentTab] = useState('tasks'); // Changed to a string to match section names
  const [selectedList, setSelectedList] = useState(currentList); // Manage selected list state

  useEffect(() => {
    initClient().catch(error => console.error("Failed to initialize Google API client:", error));
  }, []);

  useEffect(() => {
    setSelectedList(currentList);
  }, [currentList]);

  const onDragEnd = (result) => {
    // Handle drag end logic
  };

  if (!user) return <SignIn user={user} />;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="App">
        <Header
          user={user}
          signOut={signOut}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          lists={lists}
          currentList={currentList}
          setCurrentList={setCurrentList}
          addList={addList}
          deleteList={deleteList}
        />
        <MainContent
          currentTab={currentTab}
          lists={lists}
          currentList={currentList}
          setCurrentList={setCurrentList}
          updateList={updateList}
          recognizedText={recognizedText}
          aiResponse={aiResponse}
          isLoading={isLoading}
          error={error}
          handleVoiceInput={handleVoiceInput}
          setRecognizedText={setRecognizedText}
          addList={addList}
          deleteList={deleteList}
        />
      </div>
    </DragDropContext>
  );
}

export default App;
