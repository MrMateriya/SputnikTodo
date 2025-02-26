//enums
const Statuses = {
  completed: "Выполнена",
  notCompleted: "Не выполнена",
  favourite: "Избранное",
} as const

type TStatuses = typeof Statuses[keyof typeof Statuses]

//types
type TTaskAttributes = {
  status: TStatuses | null,
  title: string | null,
  description: string | null,
  createdAt: string,
  updatedAt: string,
  publishedAt: string,
}

type TBaseTaskAttributes = Pick<TTaskAttributes, "description" | "title" | "status">

type TTaskResponseSchema = {
  id: number,
  attributes: TTaskAttributes,
}

type TResponseTasks = {
  data: TTaskResponseSchema[],
}
type TResponseTask = {
  data: TTaskResponseSchema,
}

type TTaskPostSchema = {
  data: Partial<TBaseTaskAttributes>,
}

type TTaskErrorSchema = {
  data: Record<string, never>,
  error: {
    status: number,
    name: string,
    message: string,
    details: Record<string, never>,
  }
}

//type guards
function isStatuses(value: any): value is TStatuses {
  return Object.values(Statuses).includes(value)
}

export { Statuses, isStatuses }
export type {
  TStatuses,
  TTaskAttributes,
  TTaskResponseSchema,
  TResponseTask,
  TResponseTasks,
  TBaseTaskAttributes,
  TTaskPostSchema,
  TTaskErrorSchema,
}