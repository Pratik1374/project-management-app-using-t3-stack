import { api } from "@/utils/api";
import { useRouter } from "next/router";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import InputComponent from "@/components/InputCompoent";
import Dropdown from "@/components/Dropdown";
import { useUser } from "@/utils/auth";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import EditTaskForm from "@/components/EditTaskForm";
import EditProjectForm from "@/components/EditProjectForm";
import AddMemberForm from "@/components/AddMemberForm";
import AddTaskForm from "@/components/AddTaskForm";
import { string } from "zod";
import Loader from "@/components/Loader";
import { toast } from "react-toastify";

type TaskPriority = "High" | "Medium" | "Low";
type TaskStatus = "ToDo" | "InProgress" | "Completed";

const ProjectDetails: React.FC = () => {
  const router = useRouter();
  const { user: authUser, isLoading } = useUser();
  const { id: projectId } = router.query;
  const {
    data: project,
    isLoading: isProjectLoading,
    refetch: refetchProject,
  } = api.project.getProjectById.useQuery(
    { projectId: projectId as string },
    {
      enabled: !!projectId,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );
  const {
    data: tasks,
    isLoading: isTasksLoading,
    refetch: refetchTasks,
  } = api.task.getTasksByProject.useQuery(
    { projectId: projectId as string },
    {
      enabled: !!projectId,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );
  const {
    data: members,
    isLoading: isMembersLoading,
    refetch: refetchMembers,
  } = api.project.getProjectMembers.useQuery(
    { projectId: projectId as string },
    {
      enabled: !!projectId,
      refetchOnWindowFocus: false,
      retry: false,
    },
  );

  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const handleEditTask = (taskId: string) => {
    setEditingTaskId(taskId);
    setIsEditingTask(true);
  };

  const [isEditingProject, setIsEditingProject] = useState(false);
  const handleEditProject = () => {
    setIsEditingProject(true);
  };

  const [isAddingTaskModalOpen, setIsAddingTaskModalOpen] = useState(false);
  const handleOpenAddTaskModal = () => {
    setIsAddingTaskModalOpen(true);
  };

  const [isAddingMemberModalOpen, setIsAddingMemberModalOpen] = useState(false);
  const handleOpenAddMemberModal = () => {
    setIsAddingMemberModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditingProject(false);
    setIsEditingTask(false);
    setEditingTaskId(null);
    setIsAddingTaskModalOpen(false);
    setIsAddingMemberModalOpen(false);
  };

  const { mutateAsync: removeMemberMutation } =
    api.project.removeMember.useMutation();
  const { mutate: deleteTasksByAssignedUserMutation } =
    api.task.deleteTasksByAssignedUser.useMutation({
      onSuccess: () => {
        refetchMembers();
        refetchTasks();
        toast.success("Member removed successfully!");
      },
    });
  const [isDeletingMember, setIsDeletingMember] = useState("");

  const handleRemoveMember = async (memberId: string) => {
    if (projectId) {
      const confirmDelete = window.confirm(
        "Are you sure you want to remove this member? All tasks assigned to this member will also be deleted.",
      );

      if (confirmDelete) {
        setIsDeletingMember(memberId);
        try {
          await removeMemberMutation({
            projectId: projectId as string,
            userId: memberId,
          });

          deleteTasksByAssignedUserMutation({
            projectId: projectId as string,
            assignedToId: memberId,
          });
        } catch (error) {
          console.error("Error removing member:", error);
          toast.error("Error removing member. Please try again.");
        } finally {
          setIsDeletingMember("");
        }
      }
    }
  };

  if (isProjectLoading || isTasksLoading || isMembersLoading) {
    return <Loader />;
  }

  if (!project) {
    return <div className="text-gray-100">Project not found</div>;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (!authUser) {
    router.push("/login");
    return <></>;
  }
  return (
    <div className="flex h-screen bg-black text-gray-100">
      <Sidebar />
      <main className="mt-[30px] h-full flex-1 overflow-auto p-4 md:mt-0 md:p-6">
        {/* Project Details Card */}
        <Card title={"Project"}>
          <div className="flex items-start justify-between">
            <div className="w-full">
              <p className="mb-2">Name: {project.name || "No name"}</p>
              <p className="mb-2">
                Description: {project.description || "No description"}
              </p>
              <p className="text-gray-300">Description</p>
              <p className="w-full overflow-y-hidden overflow-x-clip rounded-md bg-gray-700 p-2">
                {project.description || "No description"}
              </p>
              <p className="mb-4">
                Created at:{" "}
                {project.createdAt.toLocaleDateString() +
                  " " +
                  project.createdAt.toLocaleTimeString()}
              </p>
              <p className="mb-4">
                Updated at:{" "}
                {project.updatedAt.toLocaleDateString() +
                  " " +
                  project.updatedAt.toLocaleTimeString()}
              </p>
            </div>
            <button className="edit-button" onClick={handleEditProject}>
              Edit
            </button>
          </div>
        </Card>

        {/* Project Members Card */}
        <Card>
          <div className="mb-2 flex w-full items-center justify-between">
            <h2 className="card-title">Project Members</h2>
            <button className="add-button" onClick={handleOpenAddMemberModal}>
              Add New Member
            </button>
          </div>
          {members?.length == 0 ? (
            <p className="w-full text-center text-sm text-gray-400">
              No members added yet.
            </p>
          ) : (
            <table className="my-6 w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="border border-gray-400 px-1 py-1 text-left text-[10px] font-normal md:px-4 md:py-2 md:text-[16px] md:font-semibold">
                    Name
                  </th>
                  <th className="border border-gray-400 px-1 py-1 text-left text-[10px] font-normal md:px-4 md:py-2 md:text-[16px] md:font-semibold">
                    Email
                  </th>
                  <th className="border border-gray-400 px-1 py-1 text-left text-[10px] font-normal md:px-4 md:py-2 md:text-[16px] md:font-semibold">
                    Role
                  </th>
                  <th className="border border-gray-400 px-1 py-1 text-left text-[10px] font-normal md:px-4 md:py-2 md:text-[16px] md:font-semibold"></th>{" "}
                </tr>
              </thead>
              <tbody>
                {members?.map((member) => (
                  <tr key={member.id} className="border-b border-gray-300">
                    <td className="border border-gray-400 px-1 py-1 text-left text-[10px] font-normal md:px-4 md:py-2 md:text-[14px] md:font-semibold">
                      {member.name}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-left text-[10px] font-normal md:px-4 md:py-2 md:text-[14px] md:font-semibold">
                      {member.email}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-left text-[10px] font-normal md:px-4 md:py-2 md:text-[14px] md:font-semibold">
                      {member.role}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-center text-[10px] font-normal md:px-4 md:py-2 md:text-[14px] md:font-semibold">
                      <button
                        className={`delete-button ${isDeletingMember == member.id ? "deleting" : ""}`}
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isDeletingMember == member.id}
                      >
                        {isDeletingMember == member.id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Tasks Card */}
        <Card>
          <div className="flex w-full items-center justify-between">
            <h2 className="card-title">Tasks</h2>
            <button className="add-button" onClick={handleOpenAddTaskModal}>
              Add New Task
            </button>
          </div>
          {tasks?.length == 0 ? (
            <p className="w-full text-center text-sm text-gray-400">
              No taks added yet.
            </p>
          ) : (
            <ul className="my-4 list-disc gap-[10px]">
              {tasks?.map((task) => (
                <li key={task.id} className="w-full space-y-1">
                  <Card key={`task_${task.id}`} shadow={false} border>
                    <div className="flex w-full items-start justify-between">
                      <div className="w-full flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-xl font-medium">{task.title}</h3>
                          <div className="flex gap-3">
                            <button
                              className="edit-button"
                              onClick={() => handleEditTask(task.id)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-button"
                              onClick={() => handleEditTask(task.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className=" flex w-full gap-1">
                          <p className="text-gray-300">Description: </p>
                          <p className="w-full overflow-y-hidden overflow-x-clip rounded-md bg-gray-900 p-2">
                            {task.description || "No description"}
                          </p>
                        </div>
                        {task.assignedToId && (
                          <p>
                            Assigned to:{" "}
                            {members?.find(
                              (member) => member.id === task.assignedToId,
                            )?.name || "Unknown User"}
                          </p>
                        )}
                        {task.priority && (
                          <p>
                            Priority:{" "}
                            <span className="font-semibold">
                              {task.priority}
                            </span>
                          </p>
                        )}
                        {task.status && (
                          <p>
                            Status:{" "}
                            <span className="font-semibold">{task.status}</span>
                          </p>
                        )}
                        <p className="w-full text-right text-gray-400">
                          {task.dueDate ? (
                            <>
                              <span
                                className={`${
                                  new Date(task.dueDate).getTime() <
                                    new Date().setHours(0, 0, 0, 0) &&
                                  "line-through"
                                }`}
                              >
                                Due Date:{" "}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              <>
                                {new Date(task.dueDate).getTime() <
                                new Date().setHours(0, 0, 0, 0) ? (
                                  <span className="ml-1 text-red-500">Due</span>
                                ) : (
                                  <></>
                                )}
                              </>
                            </>
                          ) : (
                            "Not set"
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Modal isOpen={isAddingTaskModalOpen} onClose={handleCloseModal}>
          <AddTaskForm
            projectId={projectId as string}
            onTaskAdded={() => {
              refetchTasks();
              handleCloseModal();
            }}
            onClose={handleCloseModal}
          />
        </Modal>

        <Modal isOpen={isAddingMemberModalOpen} onClose={handleCloseModal}>
          <AddMemberForm
            projectId={projectId as string}
            onMemberAdded={() => {
              refetchMembers();
              handleCloseModal();
            }}
            onClose={handleCloseModal}
          />
        </Modal>

        <Modal isOpen={isEditingProject} onClose={handleCloseModal}>
          <EditProjectForm
            projectId={projectId as string}
            onProjectUpdate={() => {
              refetchProject();
              handleCloseModal();
            }}
          />
        </Modal>

        <Modal isOpen={isEditingTask} onClose={handleCloseModal}>
          {editingTaskId && (
            <EditTaskForm
              taskId={editingTaskId}
              onTaskUpdate={() => {
                refetchTasks();
                handleCloseModal();
              }}
              onClose={handleCloseModal}
            />
          )}
        </Modal>
      </main>
    </div>
  );
};

export default ProjectDetails;
