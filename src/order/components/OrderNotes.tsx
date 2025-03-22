import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { FileText, AlertTriangle } from 'lucide-react'
import { extractLogsFromNotes } from './utils'

interface OrderNotesProps {
  notes: string
}

const OrderNotes = ({ notes }: OrderNotesProps) => {
  const systemLogs = extractLogsFromNotes(notes)
  const generalNotes = notes
    .split('\n')
    .filter((line) => !line.trim().startsWith('[Sistema]'))
    .join('\n')
    .trim()

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <FileText className='mr-2 h-5 w-5' />
          Notas y Actividad
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {generalNotes && (
          <div>
            <h3 className='font-medium mb-2'>Notas Generales</h3>
            <p className='whitespace-pre-line bg-gray-50 p-3 rounded-md text-gray-800'>
              {generalNotes}
            </p>
          </div>
        )}

        {systemLogs.length > 0 && (
          <div>
            <h3 className='font-medium mb-2'>Actividad del Sistema</h3>
            <ul className='space-y-2'>
              {systemLogs.map((log, index) => (
                <li
                  key={index}
                  className='bg-blue-50 p-3 rounded-md border-l-4 border-blue-300 flex items-start'
                >
                  <AlertTriangle className='h-5 w-5 text-blue-500 mr-2 mt-0.5' />
                  <div>
                    <p className='text-blue-800'>{log.content}</p>
                    {log.timestamp && (
                      <p className='text-xs text-blue-600 mt-1'>
                        {log.timestamp}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default OrderNotes
