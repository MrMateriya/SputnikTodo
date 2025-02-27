import {Container} from "../../UI";
import {AddTodoForm} from "../../components";
import {CSSProperties, Dispatch, JSX, SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Flex, List, notification, Select, SelectProps, Spin, Typography} from "antd";
import {useFetch} from "../../hooks/useFetch.ts";
import {Task, TaskService} from "../../UI";
import {produce} from "immer";
import {
  isStatuses,
  Statuses,
  TResponseTasks,
  TStatuses,
  TTaskErrorSchema,
  TTaskPostSchema,
  TTaskResponseSchema
} from "../../UI/task/types/task.ts";
import {handleError} from "../../utils/handleError.ts";
import {AxiosResponse} from "axios";
const { Text } = Typography;

const StatusesExtended = { ...Statuses, all: "Все" } as const
type TExtendedStatuses = typeof StatusesExtended[keyof typeof StatusesExtended]
type TOption = { value: TExtendedStatuses, label: TExtendedStatuses }
const pageSize = 4;

async function handleAsyncAction<T, S>(callback: (...args: unknown[]) => Promise<T>,
                                       setLoading: Dispatch<SetStateAction<S>>,
                                       startLoadingCallback: SetStateAction<S>,
                                       endLoadingCallback: SetStateAction<S>,
                                       ) {
  try {
    setLoading(startLoadingCallback)
    return await callback()
  } catch (e: unknown) {
    if (e instanceof Error) throw e
  } finally {
    setLoading(endLoadingCallback)
  }
}
const filterOptions: SelectProps<TStatuses, TOption>['options'] = [
  {
    value: "Все",
    label: "Все",
  } as const,
  {
    value: Statuses.completed,
    label: Statuses.completed,
  },
  {
    value: Statuses.notCompleted,
    label: Statuses.notCompleted,
  },
  {
    value: Statuses.favourite,
    label: Statuses.favourite,
  },
]
const AddTodoFormStyles: { form?: CSSProperties, } = {
  form: {
    marginTop: 20,
  }
}
const SelectStyles: CSSProperties = {
  width: "100%",
  marginBottom: "30px",
}

const Home = function Home(): JSX.Element {
  const [query, setQuery] = useState<URL>(new URL(`${import.meta.env.VITE_API_URL}/tasks?pagination[page]=1&pagination[pageSize]=4`))
  const [infinityScrollingPage, setInfinityScrollingPage] = useState<number>(2)
  const [addTaskLoading, setAddTaskLoading] = useState<boolean>(false)
  const [retryCounter, setRetryCounter] = useState<number>(0)
  const { value, loading, error, setValue } = useFetch<TResponseTasks, TTaskErrorSchema>(
    query.href,
    {},
    [retryCounter, query]
  )
  const [api, contextHolder] = notification.useNotification();
  const observerLastTask = useRef<IntersectionObserver | null>(null)
  const [taskIdActioning, setTaskIdActioning] = useState<number[]>([])

  const handleInfinityScrolling = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (observerLastTask.current) observerLastTask.current.disconnect();
    observerLastTask.current = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting) {
        try {
          const filter = query.searchParams.get("filters[status]")
          const res = await TaskService.getTasks({
            params: {
              "filters[status]": filter,
              "pagination[page]": infinityScrollingPage,
              "pagination[pageSize]": pageSize,
            }
          })
          if (res.data.data.length === 0) return;
          setValue(produce<TResponseTasks>((draft) => {
            if (!draft) return;
            draft.data.splice(draft.data.length, 0, ...res.data.data)
          }))
          setInfinityScrollingPage(prevNum => (prevNum + 1))
        } catch (e) {
          handleError(e, api)
        } finally {
          observerLastTask.current?.unobserve(node)
        }
      }
    }, {
      rootMargin: "100px",
    })
    observerLastTask.current.observe(node)
  }, [query, infinityScrollingPage]);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null
    if (error) {
      timer = setTimeout(() => {
        console.log('timer start')
        setRetryCounter(p => p + 1)
      }, 5000)
      handleError(error.error?.message, api)
    }

    return () => {
      if (!timer) return;
      clearTimeout(timer)
    }
  }, [error])

  const handleAddTodo = useCallback(async function handleAddTodo(title: string, description: string) {
    try {
      const body: TTaskPostSchema = {
        data: {
          title, description,
          status: StatusesExtended.notCompleted,
        }
      }
      const res = await handleAsyncAction<AxiosResponse<{data: TTaskResponseSchema}>, boolean>(
        () => TaskService.create(body),
        setAddTaskLoading,
        _ => true,
        _ => false,
      )
      if (!res) throw new Error("Failed add task")
      setValue(produce<TResponseTasks>((draft) => {
          draft.data.unshift(res.data.data)
      }))
    } catch (e: unknown) {
      handleError(e, api)
    }
  }, [])

  const handleDeleteTask = useCallback(async function handleDeleteTask(id: number) {
    try {
      await handleAsyncAction<AxiosResponse<{data: TTaskResponseSchema}>, number[]>(
        () => TaskService.delete(id),
        setTaskIdActioning,
        ids => [...ids, id],
        ids => [...ids].filter(currentId => currentId !== id),
      )
      setValue(produce<TResponseTasks>((draft) => {
        if (!draft) return
        draft.data = draft.data.filter(task => task.id !== id);
      }))
    } catch (e) {
      handleError(e, api)
    }
  }, [])

  const handleChangeTaskStatus = useCallback(async function handleChangeTaskStatus(id: number,
                                                                                   tasks: TTaskResponseSchema[],
                                                                                   setTasks: Dispatch<SetStateAction<TResponseTasks | undefined>>,
                                                                                   statusToChange: TStatuses) {
    try {
      const task = tasks.find(task => task.id === id)
      if (!task) throw new Error('Task not found');
      const { attributes: { status } } = task

      if (!isStatuses(statusToChange) || !isStatuses(status)) throw new Error(`Status not found: ${status}`);

      const res = await handleAsyncAction<AxiosResponse<{data: TTaskResponseSchema}>, number[]>(
        () => TaskService.toggleStatus(id, status, statusToChange),
        setTaskIdActioning,
        ids => [...ids, id],
        ids => [...ids].filter(currentId => currentId !== id),
      )
      if (!res) throw new Error('Failed change status');
      setTasks(produce<TResponseTasks>((draft) => {
        let taskIndex = 0;
        const task = draft.data.find((task, index) => {
          if (task.id === id) {
            taskIndex = index
            return true
          }
        })
        if (!task) throw new Error('Task not found');
        draft.data[taskIndex].attributes.status = res.data.data.attributes.status;
      }))
    } catch (e) {
      handleError(e, api)
    }
  }, [])

  const handleAddToFavoriteTask = useCallback(async function handleAddToFavoriteTask(id: number) {
    if (!value) return;
    const addedTask = value.data.find(task => task.id === id)
    if (!addedTask) throw new Error('Task not found');
    await handleChangeTaskStatus(id, [addedTask], setValue, "Избранное")
  }, [value, handleChangeTaskStatus])

  const handleDoneTask = useCallback(async function handleDoneTask(id: number) {
    if (!value) return;
    await handleChangeTaskStatus(id, value.data, setValue, "Выполнена")
  }, [value, handleChangeTaskStatus])


  const handleChangeFilters = useCallback(function handleChangeFilters(filter: TExtendedStatuses) {
    setQuery(prevUrl => {
      const newUrl = new URL(prevUrl)
      newUrl.searchParams.set("pagination[page]", String(1))
      if (filter === StatusesExtended.all) {
        newUrl.searchParams.delete("filters[status]")
        return newUrl;
      }
      newUrl.searchParams.set("filters[status]", filter)
      return  newUrl
    })
    setInfinityScrollingPage(2)
  }, [])

  const tasks = useMemo(() => {
    if (!value) return;
    const filter = query.searchParams.get("filters[status]")
    if (!filter) return value.data;
    if (!isStatuses(filter)) throw new Error('param is not a status')
    return value.data.filter(task => task.attributes.status === filter)
  }, [query, value])

  const renderItem = useCallback(function renderItem({attributes, id}: TTaskResponseSchema, index: number) {
    if (!tasks) return;
    if (tasks.length === index + 1) {
      return (
        <List.Item ref={handleInfinityScrolling} key={id}>
          <Task
            disabled={taskIdActioning.includes(id)}
            onDeleteTask={handleDeleteTask}
            onAddToFavoriteTask={handleAddToFavoriteTask}
            onDoneTask={handleDoneTask}
            id={id}
            attributes={attributes}
          />
        </List.Item>
      )
    }
    return (
      <List.Item key={id}>
        <Task
          disabled={taskIdActioning.includes(id)}
          onDeleteTask={handleDeleteTask}
          onAddToFavoriteTask={handleAddToFavoriteTask}
          onDoneTask={handleDoneTask}
          id={id}
          attributes={attributes}
        />
      </List.Item>
    )
  }, [tasks, handleInfinityScrolling, taskIdActioning, handleDeleteTask, handleAddToFavoriteTask, handleDoneTask])

  return (
    <main>
      {contextHolder}
      <Container>
        <AddTodoForm
          style={AddTodoFormStyles}
          disabled={loading || addTaskLoading}
          onSubmit={handleAddTodo}
        />
        <Select<TExtendedStatuses, TOption>
          style={SelectStyles}
          disabled={loading}
          defaultValue={filterOptions[0].value}
          options={[...filterOptions]}
          onChange={handleChangeFilters}
        />
        {
          loading
            ? <Flex justify="center" align="center">
                <Spin size="large"/>
              </Flex>
            : <List
              header={tasks
                ? <Text keyboard>Количество задач: {tasks.length}</Text>
                : null}
              itemLayout="vertical"
              dataSource={tasks?.length !== 0 ? tasks : undefined}
              renderItem={renderItem}
            />
        }
      </Container>
    </main>
  );
}

export default Home;