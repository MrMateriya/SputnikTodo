import {Statuses, TStatuses, TTaskPostSchema, TTaskResponseSchema} from "../types/task.ts";
import {AxiosRequestConfig, AxiosResponse} from "axios";
import {BackendAxios} from "../../../api/axios/axiosInstance.ts";

type ITaskService = {
  create: (body: TTaskPostSchema) => Promise<AxiosResponse<{ data: TTaskResponseSchema }>>
  delete: (id: number) => Promise<AxiosResponse<{ data: TTaskResponseSchema }>>
  getTaskById: (id: number) => Promise<AxiosResponse<{ data: TTaskResponseSchema }>>
  getTasks: () => Promise<AxiosResponse<{ data: TTaskResponseSchema[] }>>
  put: (id: number, body: TTaskPostSchema) => Promise<AxiosResponse<{ data: TTaskResponseSchema }>>
  toggleStatus: (id: number, currentStatus: TStatuses, statusToChange: TStatuses) => Promise<AxiosResponse<{ data: TTaskResponseSchema }>>
}

class TaskService implements ITaskService {
  public create(body: TTaskPostSchema, params?: AxiosRequestConfig<any>) {
    return BackendAxios.post<{ data: TTaskResponseSchema }>(
      '/tasks',
      JSON.stringify(body),
      params,
    )
  }

  public delete(id: number, params?: AxiosRequestConfig<any>) {
    return BackendAxios.delete<{ data: TTaskResponseSchema }>(
      `/tasks/${id}`,
      params,
    )
  }

  public getTaskById(id: number, params?: AxiosRequestConfig<any>) {
    return BackendAxios.get<{ data: TTaskResponseSchema }>(
      `/tasks/${id}`,
      params,
    )
  }

  public getTasks(params?: AxiosRequestConfig<any>) {
    return BackendAxios.get<{ data: TTaskResponseSchema[] }>(
      `/tasks`,
      params,
    )
  }

  public put(id: number, body: TTaskPostSchema, params?: AxiosRequestConfig<any>) {
    // вынести тип ошибки аксиоса на глольный или локальный для аксиоса
    return BackendAxios.put<{ data: TTaskResponseSchema }>(
      `/tasks/${id}`,
      JSON.stringify(body),
      params,
    )
  }

  public toggleStatus(id: number, currentStatus: TStatuses, statusToChange: TStatuses, params?: AxiosRequestConfig<any>) {
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

    return BackendAxios.put<{ data: TTaskResponseSchema }>(
      `/tasks/${id}`,
      {data: {status: statusToChange}},
      params,
    )
  }
}

const TaskServiceInstance = new TaskService()

export {TaskServiceInstance as TaskService}