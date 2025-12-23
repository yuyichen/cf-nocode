import { createForm } from '@formily/core'
import { createSchemaField } from '@formily/vue'
import {
  Form,
  FormItem,
  Input,
  Select,
  Radio,
  Checkbox,
  InputNumber,
  DatePicker,
  TimePicker,
  Switch,
  Upload,
} from '@formily/element-plus'

const { SchemaField } = createSchemaField({
  components: {
    FormItem,
    Input,
    Select,
    Radio,
    Checkbox,
    InputNumber,
    DatePicker,
    TimePicker,
    Switch,
    Upload,
  },
})

export { SchemaField, createForm }
