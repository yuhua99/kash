export type DataTableAlignment = 'left' | 'center' | 'right'

export interface DataTableColumn<T> {
  key: string
  label?: string
  accessor?: (row: T) => unknown
  align?: DataTableAlignment
  headerClass?: string
  cellClass?: string
  width?: string
}
