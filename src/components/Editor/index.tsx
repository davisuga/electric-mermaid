import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "@tanstack/react-router";
import * as Y from "yjs";
import { TitleInput } from "./TitleInput";
import { MermaidTextEditor } from "./MermaidTextEditor";
import { MermaidRenderer } from "./MermaidRenderer";
import { Awareness } from "y-protocols/awareness";
import { ElectricProvider } from "../../y-electric";
// import { ConservativeAwarenessCleanup } from "../../y-electric/awareness-cleanup"
import { useNotes, updateNote } from "../../lib/notes";
import "./editor.css";

// Map to cache ElectricProvider instances per noteId
const eProviderCache = new Map<string, ElectricProvider>();

function getProvider(noteId: string) {
  let eProvider = eProviderCache.get(noteId);

  if (!eProvider) {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);
    eProvider = new ElectricProvider(
      new URL(`/shape-proxy`, import.meta.env.VITE_API_URL).href,
      noteId,
      ydoc,
      {
        connect: true,
        awareness,
      },
    );
    awareness.on('change', ({ added, updated, removed }) => {
      // Get all current user states
      const states = awareness.getStates()
      console.log(`Current users in note ${noteId}:`, Array.from(states.values()))
    })

    // Create cleanup-er
    // new ConservativeAwarenessCleanup(awareness, {
    //   debug: true
    // })

    eProviderCache.set(noteId, eProvider);
  }

  return eProvider;
}

function ActualEditor({ noteId }: { noteId: string }) {
  console.log({ noteId });
  const eProvider = getProvider(noteId);
  const { notes, isLoading } = useNotes();
  const [mermaidContent, setMermaidContent] = useState('');
  console.log({ eProvider });

  // Mock note data for demo purposes when backend is not available
  const mockNote = {
    id: parseInt(noteId, 10),
    title: 'Mermaid Diagram Demo',
    error: null
  };

  const note = notes.find((note) => note.id === parseInt(noteId, 10)) || mockNote;

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    // Fire and forget - errors will be handled by the optimistic store
    updateNote(parseInt(noteId, 10), { title: newTitle }).catch(console.error);
  };

  const handleContentChange = (content: string) => {
    console.log(`handleContentChange with content length: ${content.length}`);
    setMermaidContent(content);
  };

  // For demo purposes, show the editor even if loading/no backend
  const showEditor = true;

  if (!showEditor) {
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <TitleInput
        title={note.title}
        onChange={handleTitleChange}
        error={note.error}
      />
      <div className="flex-1 flex">
        <div className="w-1/2 border-r border-gray-200">
          <MermaidTextEditor
            provider={eProvider}
            onContentChange={handleContentChange}
          />
        </div>
        <div className="w-1/2">
          <MermaidRenderer content={mermaidContent} />
        </div>
      </div>
    </div>
  );
}

export default function Editor() {
  const { noteId } = useParams({ from: "/note/$noteId" });
  const router = useRouter();

  useEffect(() => {
    router.invalidate();
  }, [noteId, router]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      <ActualEditor key={noteId} noteId={noteId} />
    </div>
  );
}
