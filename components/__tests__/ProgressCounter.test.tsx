import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressCounter from '../ProgressCounter'

describe('ProgressCounter', () => {
    it('renders 0% progress correctly', () => {
        render(<ProgressCounter readyCount={0} totalCount={10} />)

        expect(screen.getByText('En attente...')).toBeInTheDocument()
        expect(screen.getByText('0/10 prêts')).toBeInTheDocument()

        // Verify progress bar exists
        const progressBar = screen.getByRole('progressbar')
        expect(progressBar).toBeInTheDocument()
        expect(progressBar).toHaveAttribute('aria-label', 'Progression du groupe')
        expect(progressBar).toHaveAttribute('aria-valuenow', '0')
    })

    it('renders 50% progress correctly', () => {
        render(<ProgressCounter readyCount={5} totalCount={10} />)

        expect(screen.getByText('En attente...')).toBeInTheDocument()
        expect(screen.getByText('5/10 prêts')).toBeInTheDocument()
    })

    it('renders 100% progress correctly', () => {
        render(<ProgressCounter readyCount={10} totalCount={10} />)

        expect(screen.getByText('Tout le monde est prêt !')).toBeInTheDocument()
        expect(screen.getByText('10/10 prêts')).toBeInTheDocument()
        expect(screen.getByText('Tout le monde est prêt !')).toHaveClass('text-primary font-bold')
    })

    it('handles totalCount 0 gracefully', () => {
        render(<ProgressCounter readyCount={0} totalCount={0} />)

        expect(screen.getByText('En attente...')).toBeInTheDocument()
        expect(screen.getByText('0/0 prêts')).toBeInTheDocument()
    })
})
