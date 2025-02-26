import {
  Statuses,
  TResponseTask,
  TResponseTasks,
  TStatuses,
  TTaskPostSchema,
  TTaskResponseSchema
} from "../types/task.ts";
import {AxiosRequestConfig, AxiosResponse} from "axios";
import {BackendAxios} from "../../../api/axios/axiosInstance.ts";

type ITaskService = {
  create: (body: TTaskPostSchema) => Promise<AxiosResponse<TResponseTask>>
  delete: (id: number) => Promise<AxiosResponse<TResponseTask>>
  getTaskById: (id: number) => Promise<AxiosResponse<TResponseTask>>
  getTasks: () => Promise<AxiosResponse<{ data: TTaskResponseSchema[] }>>
  put: (id: number, body: TTaskPostSchema) => Promise<AxiosResponse<TResponseTask>>
  toggleStatus: (id: number, currentStatus: TStatuses, statusToChange: TStatuses) => Promise<AxiosResponse<TResponseTask>>
}

class TaskService implements ITaskService {
  public create(body: TTaskPostSchema, params?: AxiosRequestConfig<TResponseTask>) {
    return BackendAxios.post<TResponseTask>(
      '/tasks',
      JSON.stringify(body),
      params,
    )
  }

  public delete(id: number, params?: AxiosRequestConfig<TResponseTask>) {
    return BackendAxios.delete<TResponseTask>(
      `/tasks/${id}`,
      params,
    )
  }

  public getTaskById(id: number, params?: AxiosRequestConfig<TResponseTask>) {
    return BackendAxios.get<TResponseTask>(
      `/tasks/${id}`,
      params,
    )
  }

  public getTasks(params?: AxiosRequestConfig<TResponseTasks>) {
    return BackendAxios.get<TResponseTasks>(
      `/tasks`,
      params,
    )
  }

  public put(id: number, body: TTaskPostSchema, params?: AxiosRequestConfig<TResponseTask>) {
    return BackendAxios.put<TResponseTask>(
      `/tasks/${id}`,
      JSON.stringify(body),
      params,
    )
  }

  public toggleStatus(id: number, currentStatus: TStatuses, statusToChange: TStatuses, params?: AxiosRequestConfig<TResponseTask>) {
    switch (statusToChange) {
      case Statuses.completed:
        if (statusToChange === currentStatus) {
          statusToChange = Statuses.notCompleted
          break;
        }
        statusToChange = Statuses.completed
        break;
      case Statuses.notCompleted:
        if (statusToChange === currentStatus) {
          statusToChange = Statuses.completed
          break;
        }
        statusToChange = Statuses.notCompleted
        break;
      case Statuses.favourite:
        if (statusToChange === currentStatus) {
          statusToChange = Statuses.notCompleted
          break;
        }
        statusToChange = Statuses.favourite
        break;
    }

    return BackendAxios.put<TResponseTask>(
      `/tasks/${id}`,
      {data: {status: statusToChange}},
      params,
    )
  }
}

const TaskServiceInstance = new TaskService()

export {TaskServiceInstance as TaskService}