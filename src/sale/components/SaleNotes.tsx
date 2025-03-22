import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { FileText } from 'lucide-react'

interface SaleNotesProps {
  notes: string
}

const SaleNotes = ({ notes }: SaleNotesProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center'>
          <FileText className='mr-2 h-5 w-5' />
          Notas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>{notes}</p>
      </CardContent>
    </Card>
  )
}

export default SaleNotes
