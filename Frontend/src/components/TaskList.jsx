import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

export default function TaskList({
  tasks,
  onUpdate,
  onDelete,
  onEdit,
  selectedIds,
  onToggleSelect,
  onReorder,
  dragDisabled = false,
}) {
  const ids = tasks.map((task) => task.id);

  function handleDragEnd(event) {
    if (dragDisabled) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newOrder = arrayMove(tasks, oldIndex, newIndex);
    onReorder(newOrder.map((task) => task.id), newOrder);
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="task-list" role="list">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onEdit={onEdit}
              isSelected={selectedIds.includes(task.id)}
              onToggleSelect={onToggleSelect}
              dragDisabled={dragDisabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
