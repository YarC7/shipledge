"use client"

import { driver, type DriveStep, type Driver } from "driver.js"
import "driver.js/dist/driver.css"
import { CircleHelp } from "lucide-react"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef } from "react"

import { Button } from "@/components/ui/button"

type TourRole = "admin" | "driver"

function getVisibleElement(selector: string) {
  return Array.from(document.querySelectorAll(selector)).find((element) => element.getClientRects().length > 0)
}

function getSteps(role: TourRole, pathname: string): DriveStep[] {
  if (role === "admin") {
    if (pathname === "/admin") {
      return [
        { element: '[data-tour="admin-invoice-filter"]', popover: { title: "Lọc theo thời gian", description: "Chọn một ngày hoặc khoảng ngày bất kỳ trên một lịch. Bạn có thể lọc thêm theo tài xế." } },
        { element: '[data-tour="admin-invoice-table"]', popover: { title: "Xem hóa đơn", description: "Bấm vào một dòng để xem đầy đủ các khoản chi, ghi chú và mở hóa đơn để chỉnh sửa." } },
        { element: '[data-tour="admin-invoice-export"]', popover: { title: "Xuất báo cáo", description: "Nút này xuất đúng danh sách đang được lọc thành file CSV để xử lý hoặc gửi đi." } },
        { element: '[data-tour="admin-drivers-nav"]', popover: { title: "Tạo tài xế", description: "Mở mục Tài xế để tạo tài khoản tài xế mới bằng email và mật khẩu tạm thời." } },
        { element: '[data-tour="admin-items-nav"]', popover: { title: "Thêm item hóa đơn", description: "Mở mục Chi phí để thêm các item mà tài xế sẽ điền trên hóa đơn mới." } },
      ]
    }

    if (pathname === "/admin/drivers") {
      return [
        { element: '[data-tour="admin-add-driver"]', popover: { title: "Thêm tài xế", description: "Bấm nút này để mở biểu mẫu tạo tài khoản tài xế mới." } },
        { element: '[data-tour="admin-driver-list"]', popover: { title: "Danh sách tài xế", description: "Tài khoản đã tạo sẽ xuất hiện ở đây để bạn kiểm tra hoặc xóa khi cần." } },
      ]
    }

    if (pathname === "/admin/items") {
      return [
        { element: '[data-tour="admin-item-name"]', popover: { title: "Nhập item mới", description: "Gõ một khoản chi như Xăng hoặc Vé cầu đường vào ô này." } },
        { element: '[data-tour="admin-add-item"]', popover: { title: "Thêm item vào hóa đơn", description: "Bấm Thêm để item xuất hiện trên biểu mẫu hóa đơn của tài xế." } },
      ]
    }
  }

  if (pathname === "/driver") {
    return [
      { element: '[data-tour="driver-create-invoice"]', popover: { title: "Tạo hóa đơn", description: "Bấm Tạo mới để nhập mã chuyến hàng, ngày và các khoản chi." } },
      { element: '[data-tour="driver-invoice-list"]', popover: { title: "Hóa đơn của bạn", description: "Toàn bộ hóa đơn bạn đã gửi nằm ở đây; bạn có thể chỉnh sửa hoặc xóa từng hóa đơn." } },
    ]
  }

  if (pathname === "/driver/new" || pathname.includes("/edit")) {
    return [
      { element: '[data-tour="driver-invoice-reference"]', popover: { title: "Thông tin chuyến hàng", description: "Nhập mã chuyến hàng và ngày phát sinh hóa đơn." } },
      { element: '[data-tour="driver-invoice-costs"]', popover: { title: "Điền các khoản chi", description: "Nhập số tiền cho từng item. Tổng hóa đơn được tính tự động ở cuối danh sách." } },
      { element: '[data-tour="driver-invoice-submit"]', popover: { title: "Gửi hóa đơn", description: "Kiểm tra lại thông tin rồi bấm Gửi hóa đơn để lưu." } },
    ]
  }

  return []
}

export function ProductTour({ role }: { role: TourRole }) {
  const pathname = usePathname()
  const driverRef = useRef<Driver | null>(null)
  const steps = useMemo(() => getSteps(role, pathname), [pathname, role])
  const storageKey = `shipledger-tour-${role}-${pathname}`

  const startTour = useCallback(() => {
    const availableSteps = steps
      .filter((step) => {
        if (!step.element || typeof step.element !== "string") return true
        return Boolean(getVisibleElement(step.element))
      })
      .map((step) =>
        typeof step.element === "string"
          ? { ...step, element: () => getVisibleElement(step.element as string) as Element }
          : step,
      )
    if (availableSteps.length === 0) return

    driverRef.current?.destroy()
    const tour = driver({
      steps: availableSteps,
      animate: true,
      allowClose: true,
      allowScroll: true,
      overlayOpacity: 0.58,
      stagePadding: 8,
      stageRadius: 12,
      showProgress: true,
      nextBtnText: "Tiếp",
      prevBtnText: "Quay lại",
      doneBtnText: "Hoàn tất",
      popoverClass: "shipledger-tour",
      onDestroyed: () => window.localStorage.setItem(storageKey, "seen"),
    })
    driverRef.current = tour
    tour.drive()
  }, [steps, storageKey])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!window.localStorage.getItem(storageKey)) startTour()
    }, 550)

    return () => {
      window.clearTimeout(timer)
      driverRef.current?.destroy()
      driverRef.current = null
    }
  }, [startTour, storageKey])

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Mở hướng dẫn"
      title="Mở hướng dẫn"
      onClick={startTour}
      className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    >
      <CircleHelp className="h-4 w-4" />
    </Button>
  )
}
