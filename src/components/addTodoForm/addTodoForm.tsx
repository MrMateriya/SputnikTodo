import {CSSProperties, JSX} from 'react';
import {Button, Form, FormProps, Input} from "antd";

type TAddTodoFormProps = {
  onSubmit?: (title: string, description: string) => void,
  style?: {
    form?: CSSProperties,
  }
  loading?: boolean,
};
type TFieldTypes = {
  title: string,
  description: string,
}

const AddTodoForm = function AddTodoForm({
                                           onSubmit, style, loading,
}: TAddTodoFormProps): JSX.Element {
  const handleSubmit: FormProps<TFieldTypes>['onFinish'] = ({title, description}) => {
    if (onSubmit) onSubmit(title, description)
  }

  return (
    <Form
      disabled={loading}
      style={style?.form}
      autoComplete="off"
      onFinish={handleSubmit}>
      <Form.Item<TFieldTypes>
        name="title"
        rules={[{
        required: true,
        message: "Please enter title",
      }]}>
        <Input
          variant="outlined"
          placeholder="Title..." />
      </Form.Item>
      <Form.Item<TFieldTypes>
        name="description"
        rules={[{
        required: true,
        message: "Please enter description",
      }]}>
        <Input
          variant="outlined"
          placeholder="Description..." />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit">
          Add
        </Button>
      </Form.Item>
    </Form>
  );
}

export default AddTodoForm;