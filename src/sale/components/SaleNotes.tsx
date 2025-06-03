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
        <CardTitle className='flex items-center text-base sm:text-lg'>
          <FileText className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
          Notas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className='text-sm sm:text-base break-words'>{notes}</p>
      </CardContent>
    </Card>
  )
}

export default SaleNotes
