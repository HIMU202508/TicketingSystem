'use client'

import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react'
import TicketDetailModal from '@/components/TicketDetailModal'

type SortField = 'ticket_number' | 'device_type' | 'owner_name' | 'facility' | 'assigned_to' | 'updated_at' | 'completed_at' | 'created_at'
type SortDirection = 'asc' | 'desc'

interface Ticket {
	id: number
	ticket_number: string
	device_type: string
	repair_reason: string
	owner_name: string
	facility: string
	status: string
	serial_number?: string | null
	assigned_to: string | null
	created_at: string
	updated_at: string
	completed_at?: string | null
	remarks?: string | null
}

function RepairsTable() {
	const [repairs, setRepairs] = useState<Ticket[]>([])
	const [loading, setLoading] = useState(true)
	const [initialLoading, setInitialLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [page, setPage] = useState<number>(1)
	const [limit, setLimit] = useState<number>(10)
	const [total, setTotal] = useState<number>(0)
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [sortField, setSortField] = useState<SortField>('completed_at')
	const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
	const [facilityFilter, setFacilityFilter] = useState<string>('')
	const [assignedToFilter, setAssignedToFilter] = useState<string>('')
	const [selectedRepairs, setSelectedRepairs] = useState<Set<number>>(new Set())
	const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
	const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null)
	const abortRef = useRef<AbortController | null>(null)

	// Format date function
	const formatDateTime = useCallback((iso?: string | null) => {
		if (!iso) return '—'
		try {
			return new Date(iso).toLocaleString()
		} catch {
			return '—'
		}
	}, [])

	// Get unique values for filters
	const uniqueFacilities = useMemo(() => {
		const facilities = repairs.map(r => r.facility).filter(Boolean)
		return [...new Set(facilities)].sort()
	}, [repairs])

	const uniqueAssignees = useMemo(() => {
		const assignees = repairs.map(r => r.assigned_to).filter(Boolean)
		return [...new Set(assignees)].sort()
	}, [repairs])

	// Filter and sort repairs
	const filteredRepairs = useMemo(() => {
		let filtered = repairs.filter((r) => {
			// Search filter
			const q = searchQuery.trim().toLowerCase()
			const matchesSearch = !q || [
				String(r.id), r.ticket_number, r.device_type, r.repair_reason,
				r.owner_name, r.facility, r.assigned_to || '', r.remarks || ''
			].some((f) => f.toLowerCase().includes(q))

			// Facility filter
			const matchesFacility = !facilityFilter || r.facility === facilityFilter

			// Assigned to filter
			const matchesAssignee = !assignedToFilter || r.assigned_to === assignedToFilter

			return matchesSearch && matchesFacility && matchesAssignee
		})

		// Sort the filtered results
		filtered.sort((a, b) => {
			let aVal: any = a[sortField]
			let bVal: any = b[sortField]

			// Handle null/undefined values
			if (aVal == null && bVal == null) return 0
			if (aVal == null) return sortDirection === 'asc' ? 1 : -1
			if (bVal == null) return sortDirection === 'asc' ? -1 : 1

			// Convert to strings for comparison if needed
			if (typeof aVal === 'string') aVal = aVal.toLowerCase()
			if (typeof bVal === 'string') bVal = bVal.toLowerCase()

			// Date comparison
			if (sortField === 'completed_at' || sortField === 'created_at') {
				aVal = new Date(aVal).getTime()
				bVal = new Date(bVal).getTime()
			}

			const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
			return sortDirection === 'asc' ? result : -result
		})

		return filtered
	}, [repairs, searchQuery, facilityFilter, assignedToFilter, sortField, sortDirection])

	// Simple handler functions
	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
		} else {
			setSortField(field)
			setSortDirection('asc')
		}
	}

	const handleSelectAll = () => {
		if (selectedRepairs.size === filteredRepairs.length) {
			setSelectedRepairs(new Set())
		} else {
			setSelectedRepairs(new Set(filteredRepairs.map(r => r.id)))
		}
	}

	const handleSelectRepair = (id: number) => {
		const newSelected = new Set(selectedRepairs)
		if (newSelected.has(id)) {
			newSelected.delete(id)
		} else {
			newSelected.add(id)
		}
		setSelectedRepairs(newSelected)
	}

	const exportSelected = async () => {
		if (selectedRepairs.size === 0) return

		const selectedData = filteredRepairs.filter(r => selectedRepairs.has(r.id))
		const headers = [
			'Ticket #', 'Device', 'Issue', 'Owner', 'Serial Number', 'Facility',
			'Repair By', 'Action taken', 'Date Accepted', 'Completed At', 'Created At'
		]

		const rows = selectedData.map((r) => [
			r.ticket_number, r.device_type, r.repair_reason, r.owner_name,
			r.serial_number ?? '', r.facility, r.assigned_to ?? '', r.remarks ?? '',
			r.assigned_to ? formatDateTime(r.updated_at) : 'Not accepted yet',
			formatDateTime(r.completed_at ?? r.updated_at), formatDateTime(r.created_at)
		])

		const escapeCell = (value: unknown) => {
			const s = String(value ?? '')
			return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
		}

		const csv = [headers, ...rows]
			.map((row) => row.map(escapeCell).join(','))
			.join('\r\n')

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		const dateStr = new Date().toISOString().slice(0, 10)
		a.download = `selected_repairs_${dateStr}.csv`
		a.click()
		URL.revokeObjectURL(url)
		setSelectedRepairs(new Set())
	}

	const exportToCsv = useCallback(async () => {
		try {
			// Fetch all completed repairs for export
			const response = await fetch('/api/tickets?status=completed&export=true', {
				cache: 'no-store'
			})
			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to fetch data for export')
			}

			const allRepairs = data.tickets as Ticket[]

			const headers = [
				'Ticket #',
				'Device',
				'Issue',
				'Owner',
				'Serial Number',
				'Facility',
				'Repair By',
				'Action taken',
				'Date Accepted',
				'Completed At',
				'Created At'
			]

			const rows = allRepairs.map((r) => [
				r.ticket_number,
				r.device_type,
				r.repair_reason,
				r.owner_name,
				r.serial_number ?? '',
				r.facility,
				r.assigned_to ?? '',
				r.remarks ?? '',
				r.assigned_to ? formatDateTime(r.updated_at) : 'Not accepted yet',
				formatDateTime(r.completed_at ?? r.updated_at),
				formatDateTime(r.created_at)
			])

			const escapeCell = (value: unknown) => {
				const s = String(value ?? '')
				return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
			}

			const csv = [headers, ...rows]
				.map((row) => row.map(escapeCell).join(','))
				.join('\r\n')

			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			const dateStr = new Date().toISOString().slice(0, 10)
			a.download = `completed_repairs_${dateStr}.csv`
			a.click()
			URL.revokeObjectURL(url)
		} catch (error) {
			console.error('Export failed:', error)
			alert('Failed to export data. Please try again.')
		}
	}, [])

	useEffect(() => {
		const fetchCompleted = async (pageParam = 1) => {
			try {
				if (abortRef.current) abortRef.current.abort()
				const controller = new AbortController()
				abortRef.current = controller
				setLoading(true)
				const res = await fetch(`/api/tickets?status=completed&page=${pageParam}&limit=${limit}` , {
					signal: controller.signal,
					cache: 'default',
					headers: {
						'Cache-Control': 'max-age=30'
					}
				})
				const data = await res.json()
				if (!res.ok) throw new Error(data.error || 'Failed to fetch tickets')
				setRepairs(data.tickets as Ticket[])
				setTotal(data.total ?? (data.tickets?.length ?? 0))
			} catch (err) {
				if ((err as any)?.name === 'AbortError') return
				const message = err instanceof Error ? err.message : 'Unknown error'
				setError(message)
			} finally {
				setLoading(false)
				setInitialLoading(false)
			}
		}
		fetchCompleted(page)
	}, [page, limit])

	// Skeleton loading component
	const SkeletonRow = () => (
		<tr className="border-b border-gray-100">
			{Array.from({ length: 12 }).map((_, i) => (
				<td key={i} className="p-4">
					<div className="animate-pulse bg-gray-200 h-4 rounded"></div>
				</td>
			))}
		</tr>
	)

	if (initialLoading) {
		return (
			<div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
				{/* Header Section */}
				<div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
					<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
						<div className="flex items-center gap-4">
							<h2 className="text-2xl font-bold text-gray-800">Completed Repairs</h2>
							<div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
						</div>
						<div className="flex flex-col sm:flex-row gap-3">
							<div className="animate-pulse bg-gray-200 h-10 w-32 rounded-xl"></div>
							<div className="animate-pulse bg-gray-200 h-10 w-24 rounded-xl"></div>
						</div>
					</div>

					{/* Filters Row */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="animate-pulse bg-gray-200 h-10 rounded-xl"></div>
						))}
					</div>

					{/* Stats Row */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="animate-pulse bg-gray-200 h-6 w-48 rounded"></div>
					</div>
				</div>

				{/* Skeleton Table */}
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-200 bg-gray-50">
								<th className="p-4"><div className="animate-pulse bg-gray-200 h-4 w-4 rounded"></div></th>
								<th className="text-left p-4 text-gray-700 font-semibold">Ticket #</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Device</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Issue</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Owner</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Serial Number</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Facility</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Repair By</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Action taken</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Date Accepted</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Completed At</th>
								<th className="text-left p-4 text-gray-700 font-semibold">Actions</th>
							</tr>
						</thead>
						<tbody>
							{Array.from({ length: 5 }).map((_, i) => (
								<SkeletonRow key={i} />
							))}
						</tbody>
					</table>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
				<div className="text-center text-red-600">
					<p>Error loading repairs: {error}</p>
					<button
						onClick={() => window.location.reload()}
						className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
			{/* Header Section */}
			<div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
				<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
					<div className="flex items-center gap-4">
						<h2 className="text-2xl font-bold text-gray-800">Completed Repairs</h2>
						<div className="flex items-center gap-2">
							<button
								onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
								className="p-2 rounded-lg bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 transition-colors"
								title={`Switch to ${viewMode === 'table' ? 'grid' : 'table'} view`}
							>
								{viewMode === 'table' ? (
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
									</svg>
								) : (
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 10h18M3 16h18" />
									</svg>
								)}
							</button>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						{selectedRepairs.size > 0 && (
							<button
								onClick={exportSelected}
								className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-400 hover:to-indigo-400 transition-all duration-300 font-medium shadow-lg"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								Export Selected ({selectedRepairs.size})
							</button>
						)}
						<button
							type="button"
							onClick={exportToCsv}
							disabled={loading || filteredRepairs.length === 0}
							className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
							Export All
						</button>
					</div>
				</div>

				{/* Filters Row */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
					<div className="relative">
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
							placeholder="Search repairs..."
							className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
						/>
						<svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
						</svg>
						{searchQuery && (
							<button
								onClick={() => { setSearchQuery(''); setPage(1) }}
								className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
								title="Clear search"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						)}
					</div>

					<select
						value={facilityFilter}
						onChange={(e) => { setFacilityFilter(e.target.value); setPage(1) }}
						className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
					>
						<option value="">All Facilities</option>
						{uniqueFacilities.map(facility => (
							<option key={facility} value={facility}>{facility}</option>
						))}
					</select>

					<select
						value={assignedToFilter}
						onChange={(e) => { setAssignedToFilter(e.target.value); setPage(1) }}
						className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
					>
						<option value="">All Technicians</option>
						{uniqueAssignees.map(assignee => (
							<option key={assignee || 'unassigned'} value={assignee || ''}>{assignee}</option>
						))}
					</select>

					<select
						value={limit}
						onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }}
						className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
					>
						<option value={5}>5 per page</option>
						<option value={10}>10 per page</option>
						<option value={25}>25 per page</option>
						<option value={50}>50 per page</option>
					</select>
				</div>

				{/* Stats Row */}
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<div className="text-gray-600 text-sm font-medium">
						<span className="text-emerald-600 font-bold">{filteredRepairs.length}</span> repair{filteredRepairs.length !== 1 ? 's' : ''}
						{(searchQuery || facilityFilter || assignedToFilter) && (
							<span> found of <span className="text-emerald-600 font-bold">{total}</span> total</span>
						)}
						{selectedRepairs.size > 0 && (
							<span className="ml-4 text-blue-600">
								{selectedRepairs.size} selected
							</span>
						)}
					</div>

					{(searchQuery || facilityFilter || assignedToFilter) && (
						<button
							onClick={() => {
								setSearchQuery('')
								setFacilityFilter('')
								setAssignedToFilter('')
								setPage(1)
							}}
							className="text-gray-500 hover:text-gray-700 text-sm underline"
						>
							Clear all filters
						</button>
					)}
				</div>
			</div>
			{/* Table Content */}
			{viewMode === 'table' ? (
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-gray-200 bg-gray-50">
								<th className="p-4">
									<input
										type="checkbox"
										checked={selectedRepairs.size === filteredRepairs.length && filteredRepairs.length > 0}
										onChange={handleSelectAll}
										className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
									/>
								</th>
								{[
									{ field: 'ticket_number' as SortField, label: 'Ticket #' },
									{ field: 'device_type' as SortField, label: 'Device' },
									{ field: null, label: 'Issue' },
									{ field: 'owner_name' as SortField, label: 'Owner' },
									{ field: null, label: 'Serial Number' },
									{ field: 'facility' as SortField, label: 'Facility' },
									{ field: 'assigned_to' as SortField, label: 'Repair By' },
									{ field: null, label: 'Action taken' },
									{ field: 'updated_at' as SortField, label: 'Date Accepted' },
									{ field: 'completed_at' as SortField, label: 'Completed At' },
									{ field: null, label: 'Actions' }
								].map(({ field, label }) => (
									<th key={label} className="text-left p-4 text-gray-700 font-semibold">
										{field ? (
											<button
												onClick={() => handleSort(field)}
												className="flex items-center gap-1 hover:text-gray-900 transition-colors"
											>
												{label}
												{sortField === field && (
													<svg className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
													</svg>
												)}
											</button>
										) : (
											label
										)}
									</th>
								))}
							</tr>
						</thead>
					<tbody>
						{filteredRepairs.slice((page - 1) * limit, page * limit).map(r => (
							<tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
								<td className="p-4">
									<input
										type="checkbox"
										checked={selectedRepairs.has(r.id)}
										onChange={() => handleSelectRepair(r.id)}
										className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
									/>
								</td>
								<td className="p-4">
									<span className="text-gray-800 font-mono text-sm bg-emerald-100 px-2 py-1 rounded group-hover:bg-emerald-200 transition-colors">
										{r.ticket_number}
									</span>
								</td>
								<td className="p-4 text-gray-800">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
										{r.device_type}
									</div>
								</td>
								<td className="p-4 text-gray-800 max-w-xs">
									<div className="truncate" title={r.repair_reason}>{r.repair_reason}</div>
								</td>
								<td className="p-4 text-gray-800">{r.owner_name}</td>
								<td className="p-4 text-gray-800">
									{r.serial_number ? (
										<span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
											{r.serial_number}
										</span>
									) : (
										<span className="text-gray-500 italic">N/A</span>
									)}
								</td>
								<td className="p-4 text-gray-800">
									<span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">
										{r.facility}
									</span>
								</td>
								<td className="p-4 text-gray-800">
									{r.assigned_to ? (
										<div className="flex items-center gap-2">
											<div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
												{r.assigned_to.charAt(0).toUpperCase()}
											</div>
											{r.assigned_to}
										</div>
									) : (
										<span className="text-gray-500 italic">Unassigned</span>
									)}
								</td>
								<td className="p-4 text-gray-700 max-w-xs">
									<div className="truncate" title={r.remarks || ''}>
										{r.remarks && r.remarks.trim() !== '' ? r.remarks : (
											<span className="text-gray-500 italic">None</span>
										)}
									</div>
								</td>
								<td className="p-4 text-gray-800">
									<div className="text-sm">
										{r.assigned_to ? (
											formatDateTime(r.updated_at)
										) : (
											<span className="text-gray-500 italic">Not accepted yet</span>
										)}
									</div>
								</td>
								<td className="p-4 text-gray-800">
									<div className="text-sm">
										{formatDateTime(r.completed_at ?? r.updated_at)}
									</div>
								</td>
								<td className="p-4">
									<button
										onClick={() => setViewingTicket(r)}
										className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 rounded-lg transition-colors"
										title="View ticket details"
									>
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		) : (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
				{filteredRepairs.slice((page - 1) * limit, page * limit).map(r => (
					<div key={r.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm">
						<div className="flex items-start justify-between mb-3">
							<span className="text-gray-800 font-mono text-sm bg-emerald-100 px-2 py-1 rounded">
								{r.ticket_number}
							</span>
							<input
								type="checkbox"
								checked={selectedRepairs.has(r.id)}
								onChange={() => handleSelectRepair(r.id)}
								className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
								<span className="text-gray-800 font-medium">{r.device_type}</span>
							</div>
							<p className="text-gray-700 text-sm line-clamp-2">{r.repair_reason}</p>
							<div className="flex items-center justify-between text-xs">
								<span className="text-gray-600">{r.owner_name}</span>
								<span className="bg-gray-200 px-2 py-1 rounded text-gray-700">{r.facility}</span>
							</div>
							{r.assigned_to && (
								<div className="flex items-center gap-2 text-sm">
									<div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
										{r.assigned_to.charAt(0).toUpperCase()}
									</div>
									<span className="text-gray-800">{r.assigned_to}</span>
								</div>
							)}
							<div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
								Completed: {formatDateTime(r.completed_at ?? r.updated_at)}
							</div>
						</div>
					</div>
				))}
			</div>
		)}

			{/* Enhanced Pagination */}
			{filteredRepairs.length > limit && (
				<div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
					<div className="text-gray-600 text-sm mb-2 sm:mb-0">
						Showing {Math.min((page - 1) * limit + 1, filteredRepairs.length)} to {Math.min(page * limit, filteredRepairs.length)} of {filteredRepairs.length} repairs
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => setPage(1)}
							disabled={page <= 1 || loading}
							className={`px-3 py-2 rounded-lg text-sm ${page <= 1 || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
						>
							First
						</button>
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page <= 1 || loading}
							className={`px-3 py-2 rounded-lg text-sm ${page <= 1 || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
							</svg>
						</button>

						{/* Page numbers */}
						{Array.from({ length: Math.min(5, Math.ceil(filteredRepairs.length / limit)) }, (_, i) => {
							const totalPages = Math.ceil(filteredRepairs.length / limit)
							let pageNum
							if (totalPages <= 5) {
								pageNum = i + 1
							} else if (page <= 3) {
								pageNum = i + 1
							} else if (page >= totalPages - 2) {
								pageNum = totalPages - 4 + i
							} else {
								pageNum = page - 2 + i
							}

							return (
								<button
									key={pageNum}
									onClick={() => setPage(pageNum)}
									className={`px-3 py-2 rounded-lg text-sm ${page === pageNum ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
								>
									{pageNum}
								</button>
							)
						})}

						<button
							onClick={() => setPage((p) => Math.min(Math.ceil(filteredRepairs.length / limit), p + 1))}
							disabled={page >= Math.ceil(filteredRepairs.length / limit) || loading}
							className={`px-3 py-2 rounded-lg text-sm ${page >= Math.ceil(filteredRepairs.length / limit) || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
						>
							<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
							</svg>
						</button>
						<button
							onClick={() => setPage(Math.ceil(filteredRepairs.length / limit))}
							disabled={page >= Math.ceil(filteredRepairs.length / limit) || loading}
							className={`px-3 py-2 rounded-lg text-sm ${page >= Math.ceil(filteredRepairs.length / limit) || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
						>
							Last
						</button>
					</div>
				</div>
			)}

			{filteredRepairs.length === 0 && !loading && (
				<div className="p-12 text-center">
					<div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
						{searchQuery || facilityFilter || assignedToFilter ? (
							<svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
							</svg>
						) : (
							<svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						)}
					</div>
					<h3 className="text-xl font-medium text-gray-700 mb-2">
						{searchQuery || facilityFilter || assignedToFilter ? 'No repairs match your filters' : 'No completed repairs yet'}
					</h3>
					<p className="text-gray-500 mb-4">
						{searchQuery || facilityFilter || assignedToFilter
							? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
							: 'Mark a ticket as completed from the Tickets page to see it here.'
						}
					</p>
					{(searchQuery || facilityFilter || assignedToFilter) && (
						<button
							onClick={() => {
								setSearchQuery('')
								setFacilityFilter('')
								setAssignedToFilter('')
								setPage(1)
							}}
							className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
						>
							Clear all filters
						</button>
					)}
				</div>
			)}

			{/* Ticket Detail Modal */}
			<TicketDetailModal
				isOpen={!!viewingTicket}
				onClose={() => setViewingTicket(null)}
				ticket={viewingTicket}
			/>
		</div>
	)
}

export default memo(RepairsTable)