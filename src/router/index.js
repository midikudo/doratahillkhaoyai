import { createRouter, createWebHistory} from 'vue-router'

// Lazy imports
const UnderConstruction = () => import('../views/UnderConstruction.vue')
const Home = () => import('../views/Home.vue')
const Rooms = () => import('../views/Rooms.vue')
const Activities = () => import('../views/Activities.vue')
const Contact = () => import('../views/Contact.vue')
const Facilities = () => import('../views/Facilities.vue')
const Booking = () => import('../views/Booking.vue')
const Reviews = () => import('../views/Reviews.vue')
const NotFound = () => import('../views/NotFound.vue')

const AdminRooms = () => import('../views/AdminRooms.vue')
const AdminLayout = () => import('../layouts/AdminLayout.vue')
const AdminFacilities = () => import('../views/AdminFacilities.vue')
const AdminAttractions = () => import('../views/AdminAttractions.vue')
const AdminReviews = () => import('../views/AdminReviews.vue')
const AdminSettings = () => import('../views/AdminSettings.vue')
const AdminNews = () => import('../views/AdminNews.vue')
const AdminLogin = () => import('../views/AdminLogin.vue')
const AdminBookings = () => import('../views/AdminBookings.vue')
const AdminSlide = () => import('../views/AdminSlide.vue')
const AdminPosts = () => import('../views/AdminPosts.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Home, meta: { title: 'หน้าแรก' } },
    { path: '/rooms', name: 'rooms', component: Rooms, meta: { title: 'ที่พัก' } },
    { path: '/activities', name: 'activities', component: Activities, meta: { title: 'กิจกรรม' } },
    { path: '/contact', name: 'contact', component: Contact, meta: { title: 'ติดต่อเรา' } },
    { path: '/reviews', name: 'reviews', component: Reviews, meta: { title: 'รีวิวลูกค้า' } },
    { path: '/facilities', name: 'facilities', component: Facilities, meta: { title: 'สิ่งอำนวยความสะดวก' } },
    { path: '/booking', name: 'booking', component: Booking, meta: { title: 'จอง' } },
    { path: '/:pathMatch(.*)*', name: '404', component: NotFound, meta: { title: 'ไม่พบหน้า' } },
    {
      path: '/rooms/:id',
      name: 'room-detail',
      component: () => import('@/views/RoomDetail.vue'),
    },
    // Admin
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        { path: '', component: AdminRooms, meta: { title: 'จัดการห้อง' } },
        { path: 'rooms', component: AdminRooms, meta: { title: 'จัดการห้อง' } },
        { path: 'facilities/:category', component: AdminFacilities, meta: { title: 'จัดการข้อมูล' } },
        { path: 'post', component: AdminPosts, meta: { title: ' บทความ / เรื่องราวดีๆ จากโดราต้าฮิลล์' } },
        { path: 'attractions', component: AdminAttractions, meta: { title: 'สถานที่เที่ยวใกล้เคียง' } },
        { path: 'reviews', component: AdminReviews, meta: { title: 'รีวิวลูกค้า' } },
        { path: 'news', component: AdminNews, meta: { title: 'ข่าวสาร & โปรโมชัน' } },
        { path: 'settings', component: AdminSettings, meta: { title: 'ข้อมูลอื่น ๆ & ลิงก์จอง' } },
        { path: 'bookings', component: AdminBookings, meta: { title: 'การจอง' } },
        { path: 'slide', component: AdminSlide, meta: { title: 'จัดการสไลด์' } },
        { path: ':pathMatch(.*)*', name: '404', component: NotFound, meta: { title: 'ไม่พบหน้า' } },
        { path: 'login', name:'admin-login', component: AdminLogin, meta:{ public:true, title:'เข้าสู่ระบบแอดมิน' } },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})
function hasToken() {
  return !!localStorage.getItem('adm_token')
}
// อัปเดตชื่อหน้า
router.afterEach((to) => {
  const base = 'Pool Villa'
  document.title = to.meta?.title ? `${to.meta.title} • ${base}` : base
})

// <<< ใส่ guard ตรงนี้ >>>
router.beforeEach((to, from, next) => {
  const token = hasToken()
   // ถ้าหน้านี้ต้องล็อกอิน แต่ยังไม่มี token -> ส่งไป login
   if (to.meta.requiresAuth && !token) {
    return next({ name: 'admin-login', query: { redirect: to.fullPath } })
  }


  // if (to.meta?.requiresAuth) {
  //   const token = localStorage.getItem('admin_token')
  //   if (!token) {
  //     return next({ name: 'admin-login', query: { next: to.fullPath } })
  //   }
  // }
  next()
})
export default router
