import {Container} from "../../UI";
import {AddTodoForm} from "../../components";
import {Dispatch, JSX, SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Flex, List, notification, Select, SelectProps, Spin} from "antd";
import {useFetch} from "../../hooks/useFetch.ts";
import {Task, TaskService} from "../../UI";
import {produce} from "immer";

import {
  isStatuses,
  Statuses,
  TStatuses,
  TTaskErrorSchema,
  TTaskPostSchema,
  TTaskResponseSchema
} from "../../UI/task/types/task.ts";
import {handleError} from "../../utils/handleError.ts";

type TResponseTasks = {
  data: TTaskResponseSchema[],
}
const StatusesExtended = { ...Statuses, all: "Все" } as const
type TExtendedStatuses = typeof StatusesExtended[keyof typeof StatusesExtended]
type TOption = { value: TExtendedStatuses, label: TExtendedStatuses }
const pageSize = 4;

const Home = function Home(): JSX.Element {
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

  const [filter, setFilter] = useState<TExtendedStatuses>(StatusesExtended.all)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [query, setQuery] = useState<string>(`${import.meta.env.VITE_API_URL}/tasks?pagination[page]=${pageNumber}&pagination[pageSize]=${pageSize}`)

  const { value, loading, error, setValue } = useFetch<TResponseTasks, TTaskErrorSchema>(
    query,
    {},
    [query]
  )
  const [api, contextHolder] = notification.useNotification();
  const observerLastTask = useRef<IntersectionObserver | null>(null)

  const handleInfinityScrolling = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (observerLastTask.current) observerLastTask.current.disconnect();
    observerLastTask.current = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting) {
        try {
          const nextPage = pageNumber + 1
          const res = await TaskService.getTasks({
            params: {
              "filters[status]": filter === StatusesExtended.all ? null : filter,
              "pagination[page]": nextPage,
              "pagination[pageSize]": pageSize,
            }
          })
          if (res.data.data.length === 0) return;
          setValue(produce<TResponseTasks>((draft) => {
            if (!draft) return;
            draft.data.splice(draft.data.length, 0, ...res.data.data)
          }))
          setPageNumber(nextPage)
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
  }, [filter, pageNumber, pageSize]);

  useEffect(() => {
    if (error) {
      handleError(error.error?.message, api)
    }
  }, [error])

  async function handleAddTodo(title: string, description: string) {
    try {
      const body: TTaskPostSchema = {
        data: {
          title,
          description,
          status: StatusesExtended.notCompleted,
        }
      }
      const res = await TaskService.create(body)
      setValue(produce<TResponseTasks>((draft) => {
          draft.data.unshift(res.data.data)
      }))
    } catch (e: unknown) {
      handleError(e, api)
    }
  }

  async function handleDeleteTask(id: number) {
    try {
      await TaskService.delete(id)
      setValue(
        produce<TResponseTasks>((draft) => {
          draft.data = draft.data.filter(task => task.id !== id);
        })
      )
    } catch (e) {
      handleError(e, api)
    }
  }

  async function handleAddToFavoriteTask(id: number) {
    if (!value) return;
    const addedTask = value.data.find(task => task.id === id)
    if (!addedTask) throw new Error('Task not found');
    await handleChangeTaskStatus(id, [addedTask], setValue, "Избранное")
  }

  async function handleDoneTask(id: number) {
    if (!value) return;
    await handleChangeTaskStatus(id, value.data, setValue, "Выполнена")
  }

  async function handleChangeTaskStatus(id: number,
                                        tasks: TTaskResponseSchema[],
                                        setTasks: Dispatch<SetStateAction<TResponseTasks | undefined>>,
                                        statusToChange: TStatuses) {
    try {
      const task = tasks.find(task => task.id === id)
      if (!task) throw new Error('Task not found');
      let { attributes: { status } } = task

      if (!isStatuses(statusToChange) || !isStatuses(status)) throw new Error('Status not found');

      const res = await TaskService.toggleStatus(id, status, statusToChange)

      setTasks(
        produce<TResponseTasks>((draft) => {
          let taskIndex = 0;
          const task = draft.data.find((task, index) => {
            if (task.id === id) {
              taskIndex = index
              return true
            }
          })
          if (!task) throw new Error('Task not found');
          draft.data[taskIndex].attributes.status = res.data.data.attributes.status;
        })
      )
    } catch (e) {
      handleError(e, api)
    }
  }

  function handleChangeFilters(filter: TExtendedStatuses) {
    setPageNumber(1)
    setFilter(filter)
    if (filter !== StatusesExtended.all) {
      setQuery(`${import.meta.env.VITE_API_URL}/tasks?pagination[page]=1&pagination[pageSize]=${pageSize}&filters[status]=${filter}`)
    } else {
      setQuery(`${import.meta.env.VITE_API_URL}/tasks?pagination[page]=1&pagination[pageSize]=${pageSize}`)
    }
  }

  const tasks = useMemo(() => {
    if (!value) return;
    if (filter === StatusesExtended.all) return value.data;
    return value.data.filter(task => task.attributes.status === filter)
  }, [filter, value])

  return (
    <main>
      {contextHolder}
      <Container>
        <AddTodoForm
          style={{
              form: {
                marginTop: 20,
              }
          }}
          loading={loading}
          onSubmit={handleAddTodo}
        />
        <Select<TExtendedStatuses, TOption>
          style={{
            width: "100%",
            marginBottom: "30px",
          }}
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
              itemLayout="vertical"
              dataSource={tasks?.length !== 0 ? tasks : undefined}
              renderItem={({attributes, id}, index) => {
                if (!tasks) return;
                if (tasks.length === index + 1) {
                  return (
                    <List.Item ref={handleInfinityScrolling} key={id}>
                      <Task
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
                      onDeleteTask={handleDeleteTask}
                      onAddToFavoriteTask={handleAddToFavoriteTask}
                      onDoneTask={handleDoneTask}
                      id={id}
                      attributes={attributes}
                    />
                  </List.Item>
                )
              }}
            />
        }
      </Container>
    </main>
  );
}

export default Home;