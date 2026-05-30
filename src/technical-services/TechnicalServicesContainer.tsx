import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  PackagePlus,
  Plus,
  Search,
  Wrench
} from 'lucide-react'
import LayoutMultiRole from '../layout/LayoutMultiRole'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ComboboxProducts,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from '../components'
import { formatCurrency, formatDate, getErrorMessage } from '../utils'
import useUserStore from '../stores/userStore'
import {
  addTechnicalServicePart,
  changeTechnicalServiceStatus,
  createTechnicalService,
  getTechnicalServiceById,
  getTechnicalServiceTechnicians,
  getTechnicalServices,
  registerTechnicalServicePayment,
  removeTechnicalServicePart,
  searchServiceProducts,
  TechnicalService,
  TechnicalServiceStatus,
  updateTechnicalService
} from '../services/technicalServices.service'

const STATUS_LABELS: Record<TechnicalServiceStatus, string> = {
  RECEIVED: 'Recibido',
  DIAGNOSING: 'En diagnostico',
  WAITING_APPROVAL: 'Espera aprobacion',
  APPROVED: 'Aprobado',
  WAITING_PARTS: 'Espera repuestos',
  IN_REPAIR: 'En reparacion',
  TESTING: 'En prueba',
  COMPLETED: 'Listo para retirar',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  WARRANTY_CLAIM: 'Garantia'
}

const EQUIPMENT_TYPES = [
  ['CLIPPER', 'Maquina de corte'],
  ['TRIMMER', 'Patillera'],
  ['SHAVER', 'Shaver'],
  ['DRYER', 'Secador'],
  ['STERILIZER', 'Esterilizador'],
  ['CHAIR', 'Sillon'],
  ['OTHER', 'Otro']
] as const

const PAYMENT_METHODS = [
  ['CASH', 'Efectivo'],
  ['DEBIT', 'Debito'],
  ['CREDIT', 'Credito'],
  ['TRANSFER', 'Transferencia'],
  ['MP', 'Mercado Pago']
] as const

const getStatusVariant = (status: TechnicalServiceStatus) => {
  if (['COMPLETED', 'DELIVERED'].includes(status)) return 'default'
  if (['CANCELLED', 'WAITING_PARTS'].includes(status)) return 'destructive'
  if (['WAITING_APPROVAL', 'APPROVED'].includes(status)) return 'secondary'
  return 'outline'
}

const technicianName = (service: TechnicalService) => {
  if (!service.assignedTechnician) return 'Sin asignar'
  return typeof service.assignedTechnician === 'string'
    ? 'Tecnico asignado'
    : service.assignedTechnician.name
}

const balanceOf = (service: TechnicalService) =>
  Math.max((service.costs?.totalCost || 0) - (service.payment?.paidAmount || 0), 0)

const emptyServiceForm = {
  customerName: '',
  customerPhone: '',
  documentNumber: '',
  equipmentType: 'CLIPPER',
  brand: '',
  model: '',
  serialNumber: '',
  problem: '',
  priority: 'NORMAL',
  assignedTechnician: '',
  estimatedDelivery: ''
}

const TechnicalServicesContainer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUserStore()
  const userRole = user?.role as string
  const isTechnician = userRole === 'TECHNICIAN'
  const isFrontDesk = ['ADMIN', 'MANAGER', 'SELLER'].includes(userRole)
  const canManageWork = ['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(userRole)

  const [services, setServices] = useState<TechnicalService[]>([])
  const [service, setService] = useState<TechnicalService | null>(null)
  const [technicians, setTechnicians] = useState<Array<{ _id: string; name: string; role: string }>>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [createOpen, setCreateOpen] = useState(false)
  const [partOpen, setPartOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [form, setForm] = useState(emptyServiceForm)
  const [diagnosis, setDiagnosis] = useState({ initialInspection: '', diagnosis: '', laborCost: 0, additionalCosts: 0 })
  const [partForm, setPartForm] = useState({ productId: '', quantity: 1, unitPrice: '', notes: '' })
  const [paymentForm, setPaymentForm] = useState({ paymentMethod: 'CASH', amount: '', notes: '' })
  const [isSearchingProducts, setIsSearchingProducts] = useState(false)

  const activeStatuses = 'RECEIVED,DIAGNOSING,WAITING_APPROVAL,APPROVED,WAITING_PARTS,IN_REPAIR,TESTING,COMPLETED'

  const loadList = async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { pageSize: 50, search }
      if (statusFilter === 'active') params.status = activeStatuses
      if (statusFilter !== 'active' && statusFilter !== 'all') params.status = statusFilter
      const response = await getTechnicalServices(params)
      setServices(response.data || [])
    } catch (error) {
      toast.error(getErrorMessage(error as any))
    } finally {
      setLoading(false)
    }
  }

  const loadDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const response = await getTechnicalServiceById(id)
      setService(response.data)
      setDiagnosis({
        initialInspection: response.data.technicalDiagnosis?.initialInspection || '',
        diagnosis: response.data.technicalDiagnosis?.diagnosis || '',
        laborCost: response.data.costs?.laborCost || 0,
        additionalCosts: response.data.costs?.additionalCosts || 0
      })
      setPaymentForm((current) => ({ ...current, amount: String(balanceOf(response.data) || '') }))
    } catch (error) {
      toast.error(getErrorMessage(error as any))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getTechnicalServiceTechnicians()
      .then(setTechnicians)
      .catch(() => setTechnicians([]))
  }, [])

  useEffect(() => {
    if (id) loadDetail()
    else loadList()
  }, [id, statusFilter])

  const selectedProduct = useMemo(
    () => products.find((product) => product._id === partForm.productId),
    [products, partForm.productId]
  )

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!id) loadList()
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    if (!partOpen) return
    searchServiceProducts('')
      .then(setProducts)
      .catch(() => setProducts([]))
  }, [partOpen])

  const handlePartProductSearch = async (value: string) => {
    setIsSearchingProducts(true)
    try {
      const results = await searchServiceProducts(value)
      setProducts(results)
    } catch {
      setProducts([])
    } finally {
      setIsSearchingProducts(false)
    }
  }

  const handleCreate = async () => {
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.brand.trim() || !form.model.trim() || !form.problem.trim()) {
      toast.error('Completa cliente, telefono, equipo y problema reportado')
      return
    }

    try {
      const created = await createTechnicalService({
        customer: {
          name: form.customerName,
          phone: form.customerPhone,
          documentNumber: form.documentNumber
        },
        equipment: {
          type: form.equipmentType as any,
          brand: form.brand,
          model: form.model,
          serialNumber: form.serialNumber
        },
        customerReport: {
          description: form.problem,
          frequency: 'SOMETIMES'
        },
        priority: form.priority as any,
        assignedTechnician: form.assignedTechnician || undefined,
        estimatedDelivery: form.estimatedDelivery || undefined
      })
      toast.success(`Servicio ${created.serviceNumber} creado`)
      setCreateOpen(false)
      setForm(emptyServiceForm)
      navigate(`/technical-services/${created._id}`)
    } catch (error) {
      toast.error(getErrorMessage(error as any))
    }
  }

  const handleSaveDiagnosis = async () => {
    if (!service) return
    try {
      await updateTechnicalService(service._id, {
        technicalDiagnosis: {
          initialInspection: diagnosis.initialInspection,
          diagnosis: diagnosis.diagnosis,
          repairability: diagnosis.diagnosis ? 'REPAIRABLE' : 'PENDING_EVALUATION'
        },
        costs: {
          laborCost: Number(diagnosis.laborCost || 0),
          additionalCosts: Number(diagnosis.additionalCosts || 0)
        }
      })
      toast.success('Diagnostico y costos actualizados')
      loadDetail()
    } catch (error) {
      toast.error(getErrorMessage(error as any))
    }
  }

  const handleStatus = async (newStatus: TechnicalServiceStatus) => {
    if (!service) return
    try {
      await changeTechnicalServiceStatus(service._id, newStatus)
      toast.success(`Estado actualizado a ${STATUS_LABELS[newStatus]}`)
      loadDetail()
    } catch (error) {
      toast.error(getErrorMessage(error as any))
    }
  }

  const handleAddPart = async () => {
    if (!service || !partForm.productId) {
      toast.error('Selecciona un repuesto')
      return
    }
    try {
      await addTechnicalServicePart(service._id, {
        productId: partForm.productId,
        quantity: Number(partForm.quantity || 1),
        unitPrice: partForm.unitPrice ? Number(partForm.unitPrice) : undefined,
        notes: partForm.notes
      })
      toast.success('Repuesto agregado y stock descontado')
      setPartOpen(false)
      setPartForm({ productId: '', quantity: 1, unitPrice: '', notes: '' })
      loadDetail()
    } catch (error) {
      toast.error(getErrorMessage(error as any))
    }
  }

  const handleRemovePart = async (partId: string) => {
    if (!service) return
    try {
      await removeTechnicalServicePart(service._id, partId)
      toast.success('Repuesto quitado y stock devuelto')
      loadDetail()
    } catch (error) {
      toast.error(getErrorMessage(error as any))
    }
  }

  const handlePayment = async () => {
    if (!service) return
    try {
      await registerTechnicalServicePayment(service._id, {
        paymentMethod: paymentForm.paymentMethod,
        amount: Number(paymentForm.amount),
        notes: paymentForm.notes,
        registerInCash: true
      })
      toast.success('Pago registrado en caja')
      setPaymentOpen(false)
      loadDetail()
    } catch (error) {
      toast.error(getErrorMessage(error as any))
    }
  }

  if (id && service) {
    const balance = balanceOf(service)
    const nextStates = {
      RECEIVED: ['DIAGNOSING', 'CANCELLED'],
      DIAGNOSING: ['WAITING_APPROVAL', 'CANCELLED'],
      WAITING_APPROVAL: ['APPROVED', 'CANCELLED'],
      APPROVED: ['WAITING_PARTS', 'IN_REPAIR', 'CANCELLED'],
      WAITING_PARTS: ['IN_REPAIR', 'CANCELLED'],
      IN_REPAIR: ['TESTING', 'WAITING_PARTS', 'CANCELLED'],
      TESTING: ['COMPLETED', 'IN_REPAIR'],
      COMPLETED: ['DELIVERED', 'WARRANTY_CLAIM'],
      DELIVERED: ['WARRANTY_CLAIM'],
      CANCELLED: [],
      WARRANTY_CLAIM: ['RECEIVED', 'COMPLETED']
    }[service.status] as TechnicalServiceStatus[]

    return (
      <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER', 'SELLER', 'TECHNICIAN']} showGoBackButton>
        <div className='space-y-4 p-3 sm:p-6'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='text-2xl font-semibold'>Servicio {service.serviceNumber}</h1>
                <Badge variant={getStatusVariant(service.status)}>{STATUS_LABELS[service.status]}</Badge>
                {service.payment.isPaid ? <Badge>Pagado</Badge> : <Badge variant='outline'>Saldo {formatCurrency(balance)}</Badge>}
              </div>
              <p className='text-sm text-muted-foreground'>{service.customer.name} - {service.customer.phone}</p>
            </div>
            {isFrontDesk && !service.payment.isPaid && (
              <Button onClick={() => setPaymentOpen(true)} className='w-full sm:w-auto'>
                <CreditCard className='mr-2 h-4 w-4' />
                Registrar pago
              </Button>
            )}
          </div>

          <div className='grid gap-4 lg:grid-cols-[1.1fr_0.9fr]'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <ClipboardList className='h-5 w-5' />
                  Recepcion y estado
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <Info label='Equipo' value={`${service.equipment.brand} ${service.equipment.model}`} />
                  <Info label='Tipo' value={EQUIPMENT_TYPES.find(([value]) => value === service.equipment.type)?.[1] || service.equipment.type} />
                  <Info label='Serie' value={service.equipment.serialNumber || 'Sin serie'} />
                  <Info label='Tecnico' value={technicianName(service)} />
                  <Info label='Ingreso' value={formatDate(service.dates.receivedAt)} />
                  <Info label='Entrega estimada' value={service.dates.estimatedDelivery ? formatDate(service.dates.estimatedDelivery) : 'Sin fecha'} />
                </div>
                <div>
                  <Label>Problema reportado</Label>
                  <p className='mt-1 rounded-md border bg-muted/30 p-3 text-sm'>{service.customerReport.description}</p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {nextStates.map((status) => {
                    const blockedDelivery = status === 'DELIVERED' && balance > 0
                    const visible = canManageWork || (isFrontDesk && ['DELIVERED', 'CANCELLED'].includes(status))
                    if (!visible) return null
                    return (
                      <Button
                        key={status}
                        variant='outline'
                        size='sm'
                        disabled={blockedDelivery}
                        onClick={() => handleStatus(status)}
                      >
                        {STATUS_LABELS[status]}
                      </Button>
                    )
                  })}
                </div>
                {service.status === 'COMPLETED' && balance > 0 && (
                  <div className='flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800'>
                    <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
                    Para entregar el equipo primero se debe registrar el pago completo.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Importes</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <MoneyRow label='Mano de obra' value={service.costs.laborCost} />
                <MoneyRow label='Repuestos' value={service.costs.partsCost} />
                <MoneyRow label='Otros cargos' value={service.costs.additionalCosts} />
                <div className='border-t pt-3'>
                  <MoneyRow label='Total a cobrar' value={service.costs.totalCost} strong />
                  <MoneyRow label='Pagado' value={service.payment.paidAmount || 0} />
                  <MoneyRow label='Saldo' value={balance} strong />
                </div>
              </CardContent>
            </Card>
          </div>

          {canManageWork && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <Wrench className='h-5 w-5' />
                  Trabajo tecnico
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-3 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label>Revision inicial</Label>
                    <Textarea value={diagnosis.initialInspection} onChange={(event) => setDiagnosis({ ...diagnosis, initialInspection: event.target.value })} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Diagnostico</Label>
                    <Textarea value={diagnosis.diagnosis} onChange={(event) => setDiagnosis({ ...diagnosis, diagnosis: event.target.value })} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Mano de obra</Label>
                    <Input type='number' value={diagnosis.laborCost} onChange={(event) => setDiagnosis({ ...diagnosis, laborCost: Number(event.target.value) })} />
                  </div>
                  <div className='space-y-2'>
                    <Label>Otros cargos</Label>
                    <Input type='number' value={diagnosis.additionalCosts} onChange={(event) => setDiagnosis({ ...diagnosis, additionalCosts: Number(event.target.value) })} />
                  </div>
                </div>
                <Button onClick={handleSaveDiagnosis} className='w-full sm:w-auto'>
                  <CheckCircle2 className='mr-2 h-4 w-4' />
                  Guardar trabajo tecnico
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <CardTitle className='flex items-center gap-2 text-lg'>
                  <PackagePlus className='h-5 w-5' />
                  Repuestos usados
                </CardTitle>
                {canManageWork && !['DELIVERED', 'CANCELLED'].includes(service.status) && (
                  <Button variant='outline' onClick={() => setPartOpen(true)} className='w-full sm:w-auto'>
                    <Plus className='mr-2 h-4 w-4' />
                    Agregar repuesto
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {service.partsUsed.length === 0 ? (
                <p className='text-sm text-muted-foreground'>Todavia no se usaron repuestos.</p>
              ) : (
                <div className='space-y-2'>
                  {service.partsUsed.map((part) => {
                    const product = typeof part.product === 'object' ? part.product : null
                    return (
                      <div key={part._id} className='flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between'>
                        <div>
                          <p className='font-medium'>{product?.name || 'Producto no disponible'}</p>
                          <p className='text-sm text-muted-foreground'>Cantidad {part.quantity} - {formatCurrency(part.unitPrice)} c/u</p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='font-semibold'>{formatCurrency(part.subtotal)}</span>
                          {canManageWork && !['DELIVERED', 'CANCELLED'].includes(service.status) && (
                            <Button variant='outline' size='sm' onClick={() => handleRemovePart(part._id)}>Quitar</Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={partOpen} onOpenChange={setPartOpen}>
          <DialogContent className='max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>Agregar repuesto</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <ComboboxProducts products={products} value={partForm.productId} onChange={(productId, selectedProduct) => {
                const product = selectedProduct || products.find((item) => item._id === productId)
                setPartForm({ ...partForm, productId, unitPrice: product?.price ? String(product.price) : '' })
              }} onSearch={handlePartProductSearch} isSearching={isSearchingProducts} />
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='space-y-2'>
                  <Label>Cantidad</Label>
                  <Input type='number' min={1} value={partForm.quantity} onChange={(event) => setPartForm({ ...partForm, quantity: Number(event.target.value) })} />
                </div>
                <div className='space-y-2'>
                  <Label>Precio al cliente</Label>
                  <Input type='number' value={partForm.unitPrice} onChange={(event) => setPartForm({ ...partForm, unitPrice: event.target.value })} />
                </div>
              </div>
              {selectedProduct && <p className='text-sm text-muted-foreground'>Stock disponible: {selectedProduct.stock}</p>}
              <Textarea placeholder='Nota interna opcional' value={partForm.notes} onChange={(event) => setPartForm({ ...partForm, notes: event.target.value })} />
              <Button onClick={handleAddPart} className='w-full'>Agregar y descontar stock</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar pago</DialogTitle>
            </DialogHeader>
            <div className='space-y-3'>
              <Info label='Saldo pendiente' value={formatCurrency(balance)} />
              <div className='space-y-2'>
                <Label>Metodo</Label>
                <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Monto</Label>
                <Input type='number' value={paymentForm.amount} onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })} />
              </div>
              <Textarea placeholder='Nota del pago' value={paymentForm.notes} onChange={(event) => setPaymentForm({ ...paymentForm, notes: event.target.value })} />
              <Button onClick={handlePayment} className='w-full'>Registrar en caja</Button>
            </div>
          </DialogContent>
        </Dialog>
      </LayoutMultiRole>
    )
  }

  return (
    <LayoutMultiRole allowedRoles={['ADMIN', 'MANAGER', 'SELLER', 'TECHNICIAN']}>
      <div className='space-y-4 p-3 sm:p-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-semibold'>Servicio Tecnico</h1>
            <p className='text-sm text-muted-foreground'>
              {isTechnician ? 'Tus trabajos asignados' : 'Recepcion, seguimiento, cobro y entrega de equipos'}
            </p>
          </div>
          {isFrontDesk && (
            <Button onClick={() => setCreateOpen(true)} className='w-full sm:w-auto'>
              <Plus className='mr-2 h-4 w-4' />
              Recibir equipo
            </Button>
          )}
        </div>

        <div className='grid gap-3 md:grid-cols-[1fr_220px]'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
            <Input className='pl-9' placeholder='Buscar por cliente, telefono, numero, marca o serie' value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value='active'>Activos</SelectItem>
              <SelectItem value='all'>Todos</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <Card><CardContent className='p-6 text-sm text-muted-foreground'>Cargando servicios...</CardContent></Card>
        ) : services.length === 0 ? (
          <Card><CardContent className='p-6 text-sm text-muted-foreground'>No hay servicios para mostrar.</CardContent></Card>
        ) : (
          <div className='grid gap-3'>
            {services.map((item) => (
              <Link key={item._id} to={`/technical-services/${item._id}`}>
                <Card className='transition-colors hover:bg-muted/30'>
                  <CardContent className='p-4'>
                    <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                      <div className='space-y-1'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <span className='font-semibold'>{item.serviceNumber}</span>
                          <Badge variant={getStatusVariant(item.status)}>{STATUS_LABELS[item.status]}</Badge>
                          {item.payment.isPaid ? <Badge>Pagado</Badge> : <Badge variant='outline'>Saldo {formatCurrency(balanceOf(item))}</Badge>}
                        </div>
                        <p className='text-sm'>{item.customer.name} - {item.customer.phone}</p>
                        <p className='text-sm text-muted-foreground'>{item.equipment.brand} {item.equipment.model} - {technicianName(item)}</p>
                      </div>
                      <div className='text-left md:text-right'>
                        <p className='font-semibold'>{formatCurrency(item.costs.totalCost || 0)}</p>
                        <p className='text-sm text-muted-foreground'>Ingreso {formatDate(item.dates.receivedAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Recibir equipo</DialogTitle>
          </DialogHeader>
          <div className='grid gap-3 sm:grid-cols-2'>
            <Field label='Cliente' value={form.customerName} onChange={(value) => setForm({ ...form, customerName: value })} />
            <Field label='Telefono' value={form.customerPhone} onChange={(value) => setForm({ ...form, customerPhone: value })} />
            <Field label='Documento' value={form.documentNumber} onChange={(value) => setForm({ ...form, documentNumber: value })} />
            <div className='space-y-2'>
              <Label>Tipo de equipo</Label>
              <Select value={form.equipmentType} onValueChange={(value) => setForm({ ...form, equipmentType: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EQUIPMENT_TYPES.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Field label='Marca' value={form.brand} onChange={(value) => setForm({ ...form, brand: value })} />
            <Field label='Modelo' value={form.model} onChange={(value) => setForm({ ...form, model: value })} />
            <Field label='Numero de serie' value={form.serialNumber} onChange={(value) => setForm({ ...form, serialNumber: value })} />
            <div className='space-y-2'>
              <Label>Tecnico asignado</Label>
              <Select value={form.assignedTechnician || 'none'} onValueChange={(value) => setForm({ ...form, assignedTechnician: value === 'none' ? '' : value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Sin asignar</SelectItem>
                  {technicians.map((technician) => <SelectItem key={technician._id} value={technician._id}>{technician.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2 sm:col-span-2'>
              <Label>Problema reportado</Label>
              <Textarea value={form.problem} onChange={(event) => setForm({ ...form, problem: event.target.value })} />
            </div>
            <Button onClick={handleCreate} className='sm:col-span-2'>Crear servicio</Button>
          </div>
        </DialogContent>
      </Dialog>
    </LayoutMultiRole>
  )
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className='text-xs uppercase text-muted-foreground'>{label}</p>
    <p className='font-medium'>{value}</p>
  </div>
)

const MoneyRow = ({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) => (
  <div className={`flex items-center justify-between gap-3 ${strong ? 'font-semibold' : ''}`}>
    <span>{label}</span>
    <span>{formatCurrency(value || 0)}</span>
  </div>
)

const Field = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
  <div className='space-y-2'>
    <Label>{label}</Label>
    <Input value={value} onChange={(event) => onChange(event.target.value)} />
  </div>
)

export default TechnicalServicesContainer
