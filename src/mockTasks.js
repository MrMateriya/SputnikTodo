const Statuses = {
  completed: "Выполнена",
  notCompleted: "Не выполнена",
  favourite: "Избранное",
}

const tasks = {
  data: [
    {
      status: Statuses.notCompleted,
      title: "Задача 1",
      description: "описание 1"
    },
    {
      status: Statuses.favourite,
      title: "Задача 2",
      description: "описание 2"
    },
    {
      status: Statuses.completed,
      title: "Задача 3",
      description: "описание 3"
    },
    {
      status: Statuses.notCompleted,
      title: "Задача 4",
      description: "описание 4"
    },
    {
      status: Statuses.favourite,
      title: "Задача 5",
      description: "описание 5"
    },
    {
      status: Statuses.completed,
      title: "Задача 6",
      description: "описание 6"
    },
    {
      status: Statuses.notCompleted,
      title: "Задача 7",
      description: "описание 7"
    },
    {
      status: Statuses.favourite,
      title: "Задача 8",
      description: "описание 8"
    },
    {
      status: Statuses.completed,
      title: "Задача 9",
      description: "описание 9"
    },
  ]
}
const times = 20;
for (let i = 0; i < times; i++) {
  for (let i = 0; i < tasks.data.length; i++) {
    fetch(`https://cms.laurence.host/api/tasks`, {
      body: JSON.stringify({
        data: tasks.data[i],
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST"
    })
      .then(res => res.json())
      .then(_ => console.log(_))
      .catch(err => console.log(err))
  }
}
