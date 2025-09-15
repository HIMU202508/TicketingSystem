export type Ticket = {
  id: number
  ticket_number: string
  device_type: string
  repair_reason: string
  owner_name: string
  facility: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to: string | null
  created_at: string
  updated_at: string
}

// In-memory storage for demo purposes
// In a real application, this would be stored in a database
export const tickets: Ticket[] = [
  {
    id: 1,
    ticket_number: 'LA20250811',
    device_type: 'Laptop',
    repair_reason: 'Screen flickering and display issues',
    owner_name: 'John Doe',
    facility: 'Main Office',
    status: 'pending',
    assigned_to: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    ticket_number: 'DE20250811',
    device_type: 'Desktop',
    repair_reason: "Computer won't boot up, power issues",
    owner_name: 'Jane Smith',
    facility: 'IT Department',
    status: 'in_progress',
    assigned_to: 'Mike Johnson',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date().toISOString()
  }
]

export function findTicketById(id: number): Ticket | undefined {
  return tickets.find(t => t.id === id)
}

export function updateTicket(id: number, updates: Partial<Omit<Ticket, 'id' | 'ticket_number' | 'created_at'>>): Ticket | undefined {
  const index = tickets.findIndex(t => t.id === id)
  if (index === -1) return undefined

  const updated: Ticket = {
    ...tickets[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  tickets[index] = updated
  return updated
}

export function deleteTicket(id: number): boolean {
  const index = tickets.findIndex(t => t.id === id)
  if (index === -1) return false
  tickets.splice(index, 1)
  return true
} 