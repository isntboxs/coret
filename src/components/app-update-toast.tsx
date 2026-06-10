import { useEffect } from 'react'

import { toast } from 'sonner'
import { useRegisterSW } from 'virtual:pwa-register/react'

const appUpdateToastId = 'app-update-available'

export function AppUpdateToast() {
	const {
		needRefresh: [needRefresh, setNeedRefresh],
		updateServiceWorker,
	} = useRegisterSW()

	useEffect(() => {
		if (!needRefresh) return

		toast.info(
			'Versi baru tersedia. Refresh untuk mendapatkan fitur terbaru.',
			{
				id: appUpdateToastId,
				duration: Infinity,
				onDismiss: () => {
					setNeedRefresh(false)
				},
				action: {
					label: 'Refresh',
					onClick: () => {
						void updateServiceWorker(true)
					},
				},
				cancel: {
					label: 'Nanti',
					onClick: () => {
						setNeedRefresh(false)
						toast.dismiss(appUpdateToastId)
					},
				},
			}
		)
	}, [needRefresh, setNeedRefresh, updateServiceWorker])

	return null
}
