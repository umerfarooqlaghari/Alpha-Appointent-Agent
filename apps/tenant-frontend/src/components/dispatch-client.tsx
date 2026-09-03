"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  CheckCircle2,
  Plus,
  Search,
  Trash2,
  Edit3,
  Loader2,
  X,
  FileCheck,
  Smartphone,
  Briefcase,
  Phone,
  Mail,
  Award,
  UserPlus,
  Shield,
  Tag
} from "lucide-react";
import {
  createRoleAction,
  deleteRoleAction,
  createStaffMemberAction,
  updateStaffMemberAction,
  deleteStaffMemberAction,
  createShiftAction,
  deleteShiftAction,
  createTaskAction,
  checkInTaskAction,
  deleteTaskAction
} from "@/app/dashboard/[tenantId]/dispatch/actions";

export interface StaffRoleItem {
  id: string;
  tenantId: string;
  roleName: string;
  description?: string;
  isBuiltIn?: boolean;
}

export interface StaffMemberItem {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  skills?: string;
  status: "active" | "inactive" | "on_leave";
  createdAt: string;
  updatedAt: string;
}

export interface StaffShiftItem {
  id: string;
  tenantId: string;
  staffName: string;
  staffEmail?: string;
  role: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "active" | "completed" | "off";
  createdAt: string;
  updatedAt: string;
}

export interface DispatchTaskItem {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  fulfillmentId?: string;
  assignedToName: string;
  assignedToEmail?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "blocked";
  dueDate: string;
  checkInNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchTaskData {
  totalTasks: number;
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  blockedCount: number;
  tasks: DispatchTaskItem[];
}

export function DispatchClient({
  tenantId,
  initialRoles = [],
  initialStaffMembers = [],
  initialShifts = [],
  initialTasksData
}: {
  tenantId: string;
  initialRoles?: StaffRoleItem[];
  initialStaffMembers?: StaffMemberItem[];
  initialShifts?: StaffShiftItem[];
  initialTasksData: DispatchTaskData;
}) {
  const [activeTab, setActiveTab] = useState<"tasks" | "shifts" | "members">("tasks");
  const [roles, setRoles] = useState<StaffRoleItem[]>(initialRoles);
  const [staffMembers, setStaffMembers] = useState<StaffMemberItem[]>(initialStaffMembers);
  const [shifts, setShifts] = useState<StaffShiftItem[]>(initialShifts);
  const [tasksData, setTasksData] = useState<DispatchTaskData>(initialTasksData);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals & Action states
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMemberItem | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [checkInTask, setCheckInTask] = useState<DispatchTaskItem | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<string>("in_progress");
  const [checkInNotes, setCheckInNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Form states - Roles
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  // Form states - Member
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberRole, setMemberRole] = useState("Lead Technician");
  const [memberSkills, setMemberSkills] = useState("");
  const [memberStatus, setMemberStatus] = useState<"active" | "inactive" | "on_leave">("active");

  // Form states - Task
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().slice(0, 16));

  // Form states - Shift
  const [shiftStaffName, setShiftStaffName] = useState("");
  const [shiftStaffEmail, setShiftStaffEmail] = useState("");
  const [shiftRole, setShiftRole] = useState("Lead Technician");
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().slice(0, 10));
  const [shiftStartTime, setShiftStartTime] = useState("09:00");
  const [shiftEndTime, setShiftEndTime] = useState("17:00");

  useEffect(() => {
    setRoles(initialRoles);
    setStaffMembers(initialStaffMembers);
    setShifts(initialShifts);
    setTasksData(initialTasksData);
  }, [initialRoles, initialStaffMembers, initialShifts, initialTasksData]);

  // Handle Custom Role Add / Delete
  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await createRoleAction(tenantId, {
        roleName: newRoleName,
        description: newRoleDescription || undefined
      });
      setRoles((prev) => [...prev, created]);
      setNewRoleName("");
      setNewRoleDescription("");
    } catch (err: unknown) {
      console.error("Failed to create role", err);
      alert(err instanceof Error ? err.message : "Failed to create role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to remove this role?")) return;
    setActionLoadingId(roleId);
    try {
      await deleteRoleAction(tenantId, roleId);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    } catch (err: unknown) {
      console.error("Failed to delete role", err);
      alert(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Staff Member Add / Update
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberName("");
    setMemberEmail("");
    setMemberPhone("");
    setMemberRole(roles[0]?.roleName || "Lead Technician");
    setMemberSkills("");
    setMemberStatus("active");
    setIsMemberModalOpen(true);
  };

  const handleOpenEditMember = (member: StaffMemberItem) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberEmail(member.email || "");
    setMemberPhone(member.phone || "");
    setMemberRole(member.role);
    setMemberSkills(member.skills || "");
    setMemberStatus(member.status);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingMember) {
        const updated = await updateStaffMemberAction(tenantId, editingMember.id, {
          name: memberName,
          email: memberEmail || undefined,
          phone: memberPhone || undefined,
          role: memberRole,
          skills: memberSkills || undefined,
          status: memberStatus
        });
        setStaffMembers((prev) => prev.map((m) => (m.id === editingMember.id ? updated : m)));
      } else {
        const created = await createStaffMemberAction(tenantId, {
          name: memberName,
          email: memberEmail || undefined,
          phone: memberPhone || undefined,
          role: memberRole,
          skills: memberSkills || undefined,
          status: memberStatus
        });
        setStaffMembers((prev) => [created, ...prev]);
      }
      setIsMemberModalOpen(false);
      setEditingMember(null);
    } catch (err: unknown) {
      console.error("Failed to save staff member", err);
      alert(err instanceof Error ? err.message : "Failed to save staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    setActionLoadingId(id);
    try {
      await deleteStaffMemberAction(tenantId, id);
      setStaffMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err: unknown) {
      console.error("Failed to delete staff member", err);
      alert(err instanceof Error ? err.message : "Failed to delete staff member");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Task creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newTask = await createTaskAction(tenantId, {
        title: taskTitle,
        description: taskDescription || undefined,
        assignedToName: taskAssignee,
        priority: taskPriority,
        dueDate: new Date(taskDueDate).toISOString()
      });

      setTasksData((prev) => ({
        ...prev,
        totalTasks: prev.totalTasks + 1,
        pendingCount: prev.pendingCount + 1,
        tasks: [newTask, ...prev.tasks]
      }));

      setIsTaskModalOpen(false);
      setTaskTitle("");
      setTaskDescription("");
      setTaskAssignee("");
    } catch (err: unknown) {
      console.error("Failed to create task", err);
      alert(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInTask) return;
    setIsSubmitting(true);
    try {
      const updated = await checkInTaskAction(tenantId, checkInTask.id, {
        status: checkInStatus,
        checkInNotes: checkInNotes || undefined
      });

      setTasksData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === checkInTask.id ? updated : t))
      }));

      setCheckInTask(null);
      setCheckInNotes("");
    } catch (err: unknown) {
      console.error("Failed to submit check-in", err);
      alert(err instanceof Error ? err.message : "Failed to submit check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setActionLoadingId(id);
    try {
      await deleteTaskAction(tenantId, id);
      setTasksData((prev) => ({
        ...prev,
        totalTasks: Math.max(0, prev.totalTasks - 1),
        tasks: prev.tasks.filter((t) => t.id !== id)
      }));
    } catch (err: unknown) {
      console.error("Failed to delete task", err);
      alert(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Shift creation
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newShift = await createShiftAction(tenantId, {
        staffName: shiftStaffName,
        staffEmail: shiftStaffEmail || undefined,
        role: shiftRole,
        shiftDate,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        status: "scheduled"
      });

      setShifts((prev) => [...prev, newShift]);
      setIsShiftModalOpen(false);
      setShiftStaffName("");
      setShiftStaffEmail("");
    } catch (err: unknown) {
      console.error("Failed to schedule shift", err);
      alert(err instanceof Error ? err.message : "Failed to schedule shift");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm("Are you sure you want to remove this shift?")) return;
    setActionLoadingId(id);
    try {
      await deleteShiftAction(tenantId, id);
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      console.error("Failed to delete shift", err);
      alert(err instanceof Error ? err.message : "Failed to delete shift");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredTasks = tasksData.tasks.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.assignedToName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredShifts = shifts.filter((s) =>
    s.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = staffMembers.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.skills && m.skills.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#080C42]">
            Staff Scheduling & Task Dispatch
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Manage staff directory, dynamic roles, dispatch tickets, shift rosters, and field check-ins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition"
          >
            <Shield size={15} className="text-teal-700" /> Manage Roles ({roles.length})
          </button>

          {activeTab === "members" ? (
            <button
              onClick={handleOpenAddMember}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-800 transition"
            >
              <UserPlus size={16} /> Add Staff Member
            </button>
          ) : activeTab === "tasks" ? (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-800 transition"
            >
              <Plus size={16} /> Dispatch New Task
            </button>
          ) : (
            <button
              onClick={() => setIsShiftModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-800 transition"
            >
              <Plus size={16} /> Schedule Shift
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Staff & Roles</p>
            <Users className="text-stone-400" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-stone-900">{staffMembers.length} <span className="text-xs font-normal text-stone-500">({roles.length} roles)</span></p>
          <p className="mt-1 text-xs text-stone-400">Active team members</p>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-800">Scheduled Shifts</p>
            <Calendar className="text-teal-600" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-teal-900">{shifts.length}</p>
          <p className="mt-1 text-xs text-teal-700">Active roster slots</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">In Progress Jobs</p>
            <Smartphone className="text-blue-600" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">
            {tasksData.tasks.filter((t) => t.status === "in_progress").length}
          </p>
          <p className="mt-1 text-xs text-blue-700">Active mobile check-ins</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Completed Jobs</p>
            <CheckCircle2 className="text-emerald-600" size={18} />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-900">
            {tasksData.tasks.filter((t) => t.status === "completed").length}
          </p>
          <p className="mt-1 text-xs text-emerald-700">Delivered & verified</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${activeTab === "tasks"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
        >
          Task & Ticket Dispatch ({tasksData.tasks.length})
        </button>
        <button
          onClick={() => setActiveTab("shifts")}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${activeTab === "shifts"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
        >
          Employee Shift Schedule ({shifts.length})
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 ${activeTab === "members"
              ? "border-teal-700 text-teal-800"
              : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
        >
          Staff & Team Directory ({staffMembers.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
        <input
          type="text"
          placeholder={
            activeTab === "tasks"
              ? "Search tasks, assignees, instructions..."
              : activeTab === "shifts"
                ? "Search shift rosters, staff names, roles..."
                : "Search staff members, roles, email, skills..."
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none"
        />
      </div>

      {/* 1. Task & Ticket Dispatch View */}
      {activeTab === "tasks" && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3.5">Task / Assignment</th>
                  <th className="px-5 py-3.5">Assigned Staff</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status & Notes</th>
                  <th className="px-5 py-3.5 text-right">Mobile Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-stone-400">
                      No dispatch tasks created yet. Click &quot;Dispatch New Task&quot; to assign a ticket.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-stone-900">{task.title}</div>
                        {task.description && (
                          <p className="text-xs text-stone-500 line-clamp-1">{task.description}</p>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-stone-900 flex items-center gap-1.5">
                          <Users size={13} className="text-teal-700" />
                          {task.assignedToName}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${task.priority === "critical"
                              ? "bg-rose-100 text-rose-800"
                              : task.priority === "high"
                                ? "bg-amber-100 text-amber-800"
                                : task.priority === "medium"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-stone-100 text-stone-700"
                            }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-stone-600">
                        {new Date(task.dueDate).toLocaleDateString()} {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${task.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : task.status === "in_progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : task.status === "blocked"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                          >
                            {task.status === "in_progress"
                              ? "In Progress"
                              : task.status === "completed"
                                ? "Completed"
                                : task.status === "blocked"
                                  ? "Blocked"
                                  : "Pending"}
                          </span>
                        </div>
                        {task.checkInNotes && (
                          <p className="mt-1 text-xs text-stone-500 italic">Note: {task.checkInNotes}</p>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setCheckInTask(task);
                            setCheckInStatus(task.status === "pending" ? "in_progress" : "completed");
                            setCheckInNotes(task.checkInNotes || "");
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-[#0f766e] px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-800 shadow-2xs"
                        >
                          <Smartphone size={12} /> Check-In
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={actionLoadingId === task.id}
                          className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Employee Shift Calendar View */}
      {activeTab === "shifts" && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3.5">Staff Member</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Shift Date</th>
                  <th className="px-5 py-3.5">Working Hours</th>
                  <th className="px-5 py-3.5">Shift Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-stone-400">
                      No shift records found. Click &quot;Schedule Shift&quot; to create staff rosters.
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-stone-900">{shift.staffName}</div>
                        {shift.staffEmail && (
                          <div className="text-xs text-stone-400">{shift.staffEmail}</div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                          <Briefcase size={11} className="text-teal-700" />
                          {shift.role}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-stone-700">
                        {shift.shiftDate}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs text-stone-700">
                        {shift.startTime} – {shift.endTime}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${shift.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : shift.status === "completed"
                                ? "bg-blue-100 text-blue-800"
                                : shift.status === "off"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                            }`}
                        >
                          {shift.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteShift(shift.id)}
                          disabled={actionLoadingId === shift.id}
                          className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Staff & Team Directory View */}
      {activeTab === "members" && (
        <div className="rounded-xl border border-stone-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3.5">Staff Name & Contact</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Skills / Specialties</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-stone-400">
                      No staff members registered yet. Click &quot;Add Staff Member&quot; to build your roster.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-stone-900">{member.name}</div>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                          {member.email && (
                            <span className="flex items-center gap-1">
                              <Mail size={11} className="text-stone-400" /> {member.email}
                            </span>
                          )}
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={11} className="text-stone-400" /> {member.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-800">
                          <Briefcase size={12} className="text-teal-700" />
                          {member.role}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-stone-600">
                        {member.skills ? (
                          <span className="inline-flex items-center gap-1 text-stone-700 font-medium">
                            <Award size={12} className="text-amber-600" /> {member.skills}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold capitalize ${member.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : member.status === "on_leave"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-stone-100 text-stone-600"
                            }`}
                        >
                          {member.status === "on_leave" ? "On Leave" : member.status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenEditMember(member)}
                          className="rounded p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition"
                          title="Edit Staff Member"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={actionLoadingId === member.id}
                          className="rounded p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete Staff Member"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manage Roles Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Shield className="text-teal-700" size={18} /> Manage Organization Roles
              </h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            {/* Existing Roles List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs font-semibold uppercase text-stone-500 tracking-wider">Available Roles ({roles.length})</p>
              {roles.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50/60 p-3 text-sm">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{r.roleName}</span>
                      {r.isBuiltIn ? (
                        <span className="rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600">Default</span>
                      ) : (
                        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-semibold text-teal-800">Custom</span>
                      )}
                    </div>
                    {r.description && <p className="text-xs text-stone-500 mt-0.5">{r.description}</p>}
                  </div>
                  {!r.isBuiltIn && (
                    <button
                      onClick={() => handleDeleteRole(r.id)}
                      disabled={actionLoadingId === r.id}
                      className="rounded p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition"
                      title="Delete Custom Role"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Custom Role Form */}
            <form onSubmit={handleAddRole} className="border-t border-stone-200 pt-3 space-y-3">
              <p className="text-xs font-semibold uppercase text-teal-800 tracking-wider flex items-center gap-1">
                <Tag size={12} /> Add New Custom Role
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Role Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Plumber / Senior Architect"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Handles emergency structural issues"
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || !newRoleName.trim()}
                  className="inline-flex items-center gap-1 rounded-md bg-[#0f766e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                  Add Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Member Add/Edit Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="text-teal-700" size={18} />
                {editingMember ? "Edit Staff Member" : "Add Staff Member"}
              </h3>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Johnson"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="liam@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+1 555 0192"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-700">Role / Designation</label>
                  </div>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.roleName}>
                        {r.roleName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Status</label>
                  <select
                    value={memberStatus}
                    onChange={(e) => setMemberStatus(e.target.value as StaffMemberItem["status"])}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Skills / Specialties</label>
                <input
                  type="text"
                  placeholder="e.g. Master Electrician, Diagnostics, Fluent Spanish"
                  value={memberSkills}
                  onChange={(e) => setMemberSkills(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {editingMember ? "Save Changes" : "Create Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileCheck className="text-teal-700" size={18} /> Dispatch New Task
              </h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Task Title / Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Catering Delivery / Service Diagnostics"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Assigned Staff Member</label>
                  {staffMembers.length > 0 ? (
                    <select
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      required
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none font-medium"
                    >
                      <option value="">Select a team member...</option>
                      {staffMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marcus Vance"
                      value={taskAssignee}
                      onChange={(e) => setTaskAssignee(e.target.value)}
                      className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Priority Level</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as "low" | "medium" | "high" | "critical")}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">🚨 Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Due Deadline</label>
                <input
                  type="datetime-local"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Instructions & Field Notes</label>
                <textarea
                  rows={3}
                  placeholder="Detailed instructions for the mobile field team..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Dispatch Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Check-In Modal */}
      {checkInTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Smartphone className="text-teal-700" size={18} /> Mobile Job Check-In
              </h3>
              <button onClick={() => setCheckInTask(null)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-3">
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-xs space-y-1">
                <p className="font-bold text-stone-900">{checkInTask.title}</p>
                <p className="text-stone-500">Assigned to: {checkInTask.assignedToName}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Update Job Status</label>
                <select
                  value={checkInStatus}
                  onChange={(e) => setCheckInStatus(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm font-semibold focus:border-teal-600 focus:outline-none"
                >
                  <option value="in_progress">🚗 In Progress (On Site / En Route)</option>
                  <option value="completed">✅ Completed (Work Done)</option>
                  <option value="blocked">⚠️ Blocked (Need Assistance / Missing Keys)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700">Field Check-In Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Arrived on site, customer confirmed, job finished smoothly."
                  value={checkInNotes}
                  onChange={(e) => setCheckInNotes(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setCheckInTask(null)}
                  className="rounded-md border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Save Check-In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Shift Modal */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 text-stone-900 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="text-teal-700" size={18} /> Schedule Employee Shift
              </h3>
              <button onClick={() => setIsShiftModalOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700">Staff Member</label>
                {staffMembers.length > 0 ? (
                  <select
                    value={shiftStaffName}
                    onChange={(e) => {
                      const selected = staffMembers.find((m) => m.name === e.target.value);
                      setShiftStaffName(e.target.value);
                      if (selected) {
                        setShiftStaffEmail(selected.email || "");
                        setShiftRole(selected.role);
                      }
                    }}
                    required
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none font-medium"
                  >
                    <option value="">Select a team member...</option>
                    {staffMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jordan Smith"
                    value={shiftStaffName}
                    onChange={(e) => setShiftStaffName(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Role / Designation</label>
                  <select
                    value={shiftRole}
                    onChange={(e) => setShiftRole(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.roleName}>
                        {r.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700">Shift Date</label>
                  <input
                    type="date"
                    required
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700">Start Time</label>
                  <input
                    type="time"
                    required
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700">End Time</label>
                  <input
                    type="time"
                    required
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    className="mt-1 w-full rounded-md border border-stone-300 p-2 text-sm focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsShiftModalOpen(false)}
                  className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Save Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
