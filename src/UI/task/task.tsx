import {CSSProperties, JSX, Key, Ref} from 'react';
import {Button, Card, Typography} from "antd";
import {CheckCircleFilled, CloseCircleFilled, HeartFilled} from "@ant-design/icons";
import {Statuses, TBaseTaskAttributes} from "./types/task.ts";
const { Text } = Typography;

type TTask = {
  style?: CSSProperties,
  key?: Key | null | undefined
  id: number,
  rootRef?: Ref<HTMLDivElement>,
  disabled?: boolean,
  onDoneTask?: (id: number, attributes: TBaseTaskAttributes) => void,
  onDeleteTask?: (id: number, attributes: TBaseTaskAttributes) => void,
  onAddToFavoriteTask?: (id: number, attributes: TBaseTaskAttributes) => void,
  attributes: TBaseTaskAttributes,
}

const Task = ({
                style,
                rootRef,
                disabled,
                key,
                id,
                onDoneTask,
                onDeleteTask,
                onAddToFavoriteTask,
                attributes,
}: TTask): JSX.Element => {
  const { title, description, status } = attributes

  function handleDoneTask() {
    if (onDoneTask) onDoneTask(id, attributes);
  }
  function handleDeleteTask() {
    if (onDeleteTask) onDeleteTask(id, attributes);
  }
  function handleAddToFavoriteTask() {
    if (onAddToFavoriteTask) onAddToFavoriteTask(id, attributes);
  }

  let statusTitle = null
  switch (status) {
    case Statuses.favourite:
      statusTitle = <Text type="warning">{status}</Text>
      break;
    case Statuses.completed:
      statusTitle = <Text type="success">{status}</Text>
      break;
    case Statuses.notCompleted:
      statusTitle = <Text type="danger">{status}</Text>
      break;
    default:
      statusTitle = <Text type="danger">{Statuses.notCompleted}</Text>
  }

  return (
    <Card
      id={String(id)}
      ref={rootRef}
      styles={{
        body: {
          overflow: "hidden",
        }
      }}
      title={title}
      extra={statusTitle}
      key={key}
      style={style}
      actions={[
        <Button disabled={disabled} onClick={handleDoneTask}>
          <CheckCircleFilled style={{width: "fit-content"}}/>
        </Button>,
        <Button disabled={disabled} onClick={handleDeleteTask}>
          <CloseCircleFilled style={{width: "fit-content"}}/>
        </Button>,
        <Button disabled={disabled} onClick={handleAddToFavoriteTask}>
          <HeartFilled style={{width: "fit-content"}}/>
        </Button>,
      ]}
    >
        {description}
    </Card>
  );
};

export default Task;