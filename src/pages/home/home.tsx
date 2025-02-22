import {Container} from "../../UI/container/container.styled.ts";
import {AddTodoForm} from "../../components";
import {Dispatch, JSX, SetStateAction, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Flex, List, notification, Select, SelectProps, Spin} from "antd";
import {useFetch} from "../../hooks/useFetch.ts";
import {Task} from "../../UI";
import {produce} from "immer";
import axios from "axios";
import {
  isStatuses,
  Statuses,
  TStatuses,
  TTaskErrorSchema,
  TTaskPostSchema,
  TTaskResponseSchema
} from "../../UI/task/types/task.ts";
import {NotificationInstance} from "antd/es/notification/interface";

type TResponseTasks = {
  data: TTaskResponseSchema[],
}

const StatusExtended = { ...Statuses, all: "Все" } as const
type TExtendedStatuses = typeof StatusExtended[keyof typeof StatusExtended]
type TOption = { value: TExtendedStatuses, label: TExtendedStatuses }
const pageSize = 4;

function handleError(e: unknown, api: NotificationInstance) {
    console.error(e);
    let errorMessage = 'Something went wrong';

    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (e && typeof e === 'object' && 'message' in e) {
      errorMessage = (e as { message: string }).message;
    }
    api.warning({
      message: errorMessage,
      placement: 'bottomLeft',
    });
}

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

  const [filter, setFilter] = useState<TExtendedStatuses>(StatusExtended.all)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [query, setQuery] = useState<string>(`${import.meta.env.VITE_API_URL}/tasks?pagination[page]=${pageNumber}&pagination[pageSize]=${pageSize}`)

  const { value, loading, error, setValue } = useFetch<TResponseTasks, TTaskErrorSchema>(
    query,
    {},
    [query]
  )
  const [api, contextHolder] = notification.useNotification();

  const observerLastTask = useRef<IntersectionObserver | null>(null)

  const handleInfinityScrolling = useCallback(function handleSetLastTask(node: HTMLDivElement | null) {
    if (!node) return;
    if (observerLastTask.current) observerLastTask.current.disconnect();
    observerLastTask.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPageNumber(prevPage => {
          const nextPage = prevPage + 1
          let query = `${import.meta.env.VITE_API_URL}/tasks?pagination[page]=${nextPage}&pagination[pageSize]=${pageSize}`
          if (filter !== StatusExtended.all) {
            query = `${import.meta.env.VITE_API_URL}/tasks?pagination[page]=${nextPage}&pagination[pageSize]=${pageSize}&filters[status]=${filter}`
          }
          axios.get<TResponseTasks>(query)
            .then(res => {
              if (res.data.data.length === 0) return;
              setValue(produce<TResponseTasks>((draft) => {
                if (!draft) return;
                res.data.data.forEach(task => {
                  draft.data.push(task);
                })
              }))
            })
            .catch(e => {
              console.error(e)
              api.warning({
                message: error?.error?.message || e?.message || 'Something went wrong',
                placement: 'bottomLeft',
              })
            })
            .finally(() => {
              observerLastTask.current?.unobserve(node)
            })
          return nextPage
        })
      }
    }, {
      rootMargin: "100px",
    })
    observerLastTask.current.observe(node)
  }, [filter]);

  useEffect(() => {
    if (error) {
      api.warning({
        message: error?.error?.message || 'Something went wrong',
        placement: 'bottomLeft',
      })
    }
  }, [error])

  async function handleAddTodo(title: string, description: string) {
    try {
      const body: TTaskPostSchema = {
        data: {
          title,
          description,
          status: "Не выполнена",
        }
      }
      const res = await axios.post<{ data: TTaskResponseSchema}>(
        `${import.meta.env.VITE_API_URL}/tasks`,
        JSON.stringify(body),
        {
          headers: {
            "Content-Type": "application/json",
          }
        },
      )
      setValue(produce<TResponseTasks>((draft) => {
          draft.data.unshift(res.data.data)
      }))
    } catch (e: unknown) {
      handleError(e, api)
    }
  }

  async function handleDeleteTask(id: number) {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/tasks/${id}`)
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

  async function handleChangeTaskStatus(id: number, tasks: TTaskResponseSchema[], setTasks: Dispatch<SetStateAction<TResponseTasks | undefined>>, statusToChange: TStatuses) {
    try {
      if (!isStatuses(statusToChange)) throw new Error('Status not found');
      const task = tasks.find(task => task.id === id)
      if (!task) throw new Error('Task not found');
      const { attributes: { title, status, description } } = task

      let currentStatus = statusToChange;

      switch (statusToChange) {
        case Statuses.completed:
          if (statusToChange === status) {
            currentStatus = Statuses.notCompleted
            break;
          }
          currentStatus = Statuses.completed
          break;
        case Statuses.notCompleted:
          if (statusToChange === status) {
            currentStatus = Statuses.completed
            break;
          }
          currentStatus = Statuses.notCompleted
          break;
        case Statuses.favourite:
          if (statusToChange === status) {
            currentStatus = Statuses.notCompleted
            break;
          }
          currentStatus = Statuses.favourite
          break;
      }

      await axios.put<TTaskPostSchema>(`${import.meta.env.VITE_API_URL}/tasks/${id}`, {
        data: {
          status: currentStatus,
          title,
          description,
        }
      })

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
          draft.data[taskIndex].attributes.status = currentStatus;
        })
      )
    } catch (e) {
      handleError(e, api)
    }
  }

  function handleChangeFilters(filter: TExtendedStatuses) {
    setFilter(filter)
    setPageNumber(1)
    if (filter !== StatusExtended.all) {
      setQuery(`${import.meta.env.VITE_API_URL}/tasks?pagination[page]=1&pagination[pageSize]=${pageSize}&filters[status]=${filter}`)
    } else {
      setQuery(`${import.meta.env.VITE_API_URL}/tasks?pagination[page]=1&pagination[pageSize]=${pageSize}`)
    }
  }

  const tasks = useMemo(() => {
    if (!value) return;
    if (filter === StatusExtended.all) return value.data;
    return value.data.filter(task => task.attributes.status === filter)
  }, [filter, value])

  return (
    <main>
      {
        contextHolder
      }
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
                if (tasks?.length === index + 1) {
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