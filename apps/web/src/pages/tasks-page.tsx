import type { Task } from '@nexora/shared';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Can } from '@/components/auth/can';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskBoardView } from '@/pages/tasks/task-board-view';
import { TaskCalendarView } from '@/pages/tasks/task-calendar-view';
import { TaskFormDialog } from '@/pages/tasks/task-form-dialog';
import { TaskListView } from '@/pages/tasks/task-list-view';

export function TasksPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  function openCreateDialog() {
    setEditingTask(undefined);
    setFormOpen(true);
  }

  function openEditDialog(task: Task) {
    setEditingTask(task);
    setFormOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Track work across your team with lists, boards, and calendars."
        actions={
          <Can permission="tasks.create">
            <Button onClick={openCreateDialog}>
              <Plus />
              New task
            </Button>
          </Can>
        }
      />

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <TaskListView onEdit={openEditDialog} />
        </TabsContent>
        <TabsContent value="board">
          <TaskBoardView onTaskClick={openEditDialog} />
        </TabsContent>
        <TabsContent value="calendar">
          <TaskCalendarView onTaskClick={openEditDialog} />
        </TabsContent>
      </Tabs>

      <TaskFormDialog open={formOpen} onOpenChange={setFormOpen} task={editingTask} />
    </div>
  );
}
