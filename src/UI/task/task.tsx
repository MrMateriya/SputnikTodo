import { CSSProperties, JSX, Key } from 'react';
import { Card, Typography } from "antd";
import {CheckCircleFilled, CloseCircleFilled, HeartFilled} from "@ant-design/icons";
import {Statuses, TBaseTaskAttributes} from "./types/task.ts";
const { Text } = Typography;

type TTask = {
  style?: CSSProperties,
  key?: Key | null | undefined
  id: number,
  loading?: boolean,
  onDoneTask?: (id: number, attributes: TBaseTaskAttributes) => void,
  onDeleteTask?: (id: number, attributes: TBaseTaskAttributes) => void,
  onAddToFavoriteTask?: (id: number, attributes: TBaseTaskAttributes) => void,
  attributes: TBaseTaskAttributes,
}

const Task = ({
                style,
                loading,
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
        <CheckCircleFilled disabled={loading} style={{width: "fit-content"}} onClick={handleDoneTask}/>,
        <CloseCircleFilled disabled={loading} style={{width: "fit-content"}} onClick={handleDeleteTask}/>,
        <HeartFilled disabled={loading} style={{width: "fit-content"}} onClick={handleAddToFavoriteTask}/>,
      ]}
    >
        {description}
    </Card>
  );
};

export default Task;